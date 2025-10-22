import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';

export interface MCPResponse {
  jsonrpc: string;
  id?: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  method?: string;
  params?: any;
}

export class TestMCPClient extends EventEmitter {
  private process: ChildProcess | null = null;
  private buffer: string = '';
  private requestId: number = 1;

  async connect(): Promise<void> {
    const serverPath = path.join(__dirname, '../../dist/index.js');

    this.process = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_ENV: 'development', // Use development for tests
        ADAPTER_TYPE: 'built-in',
        ADAPTER_NAME: 'mock',
        LOG_LEVEL: 'error', // Reduce noise during tests
      },
    });

    this.process.stdout?.on('data', (data: Buffer) => {
      this.buffer += data.toString();
      this.processBuffer();
    });

    this.process.stderr?.on('data', (data: Buffer) => {
      if (process.env.DEBUG_TESTS) {
        console.error('Server error:', data.toString());
      }
    });

    this.process.on('error', (error) => {
      console.error('Process error:', error);
      this.emit('error', error);
    });

    this.process.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error('Process exited with code:', code);
      }
      this.emit('exit', code);
    });

    // Wait for server to be ready
    await this.waitForReady();
  }

  async disconnect(): Promise<void> {
    if (this.process) {
      // Remove all listeners first to prevent memory leaks
      this.removeAllListeners();

      // Optionally skip sending OS signals in restricted environments
      const skipSignals = process.env.NO_KILL === 'true';

      // Try graceful termination if allowed
      if (!skipSignals) {
        try {
          this.process.kill('SIGTERM');
        } catch (err: any) {
          // In sandboxed environments kill may be disallowed (EPERM)
          if (err && err.code !== 'EPERM') {
            throw err;
          }
        }
      } else {
        // Close stdin to encourage graceful exit without signals
        try {
          this.process.stdin?.end();
        } catch {
          // NO-OP
        }
      }

      // Wait for graceful shutdown or force kill after timeout
      const exitPromise = new Promise<void>((resolve) => {
        const onExit = () => {
          this.process = null;
          resolve();
        };

        if (this.process!.killed || this.process!.exitCode !== null) {
          onExit();
          return;
        }

        this.process!.once('exit', onExit);
      });

      // Wait up to 2 seconds for graceful shutdown
      const timeoutPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          if (this.process && !this.process.killed && this.process.exitCode === null) {
            if (!skipSignals) {
              try {
                this.process.kill('SIGKILL');
              } catch (err: any) {
                // Ignore EPERM in restricted sandboxes
                if (!err || err.code !== 'EPERM') {
                  // Still resolve to avoid hanging tests
                }
              }
            } else {
              try {
                this.process.stdin?.end();
              } catch {
                // NO-OP
              }
            }
            // Give a short moment then clean up reference
            setTimeout(() => {
              this.process = null;
              resolve();
            }, 100);
          } else {
            resolve();
          }
        }, 2000);
      });

      await Promise.race([exitPromise, timeoutPromise]);
    }
  }

  async sendRequest(method: string, params?: any): Promise<any> {
    if (!this.process || !this.process.stdin) {
      throw new Error('Client not connected');
    }

    const id = this.requestId++;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.removeAllListeners(`response-${id}`);
        reject(new Error(`Request timeout for ${method}`));
      }, 5000);

      this.once(`response-${id}`, (response: MCPResponse) => {
        clearTimeout(timeout);
        if (response.error) {
          resolve({ __jsonRpcError: true, ...response.error });
        } else {
          resolve(response.result);
        }
      });

      const message = JSON.stringify(request) + '\n';
      this.process!.stdin!.write(message);
    });
  }

  async sendNotification(method: string, params?: any): Promise<void> {
    if (!this.process || !this.process.stdin) {
      throw new Error('Client not connected');
    }

    const notification = {
      jsonrpc: '2.0',
      method,
      params,
    };

    const message = JSON.stringify(notification) + '\n';
    this.process.stdin.write(message);
  }

  private processBuffer(): void {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line) as MCPResponse;
          if (message.id !== undefined) {
            this.emit(`response-${message.id}`, message);
          } else if (message.method) {
            this.emit('notification', message);
          }
        } catch (error) {
          if (process.env.DEBUG_TESTS) {
            console.error('Failed to parse message:', line, error);
          }
        }
      }
    }
  }

  private async waitForReady(): Promise<void> {
    // Give the server a moment to start
    await new Promise((resolve) => setTimeout(resolve, 500));

    const maxAttempts = 10;
    let lastError: Error | undefined;

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await this.sendRequest('initialize', {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
          },
          clientInfo: {
            name: 'test-client',
            version: '1.0.0',
          },
        });

        if (response && response.protocolVersion) {
          // Send initialized notification
          await this.sendNotification('notifications/initialized');
          return;
        }
      } catch (error) {
        lastError = error as Error;
        if (process.env.DEBUG_TESTS) {
          console.error(`Initialization attempt ${i + 1} failed:`, error);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    throw new Error(`Server failed to start after ${maxAttempts} attempts: ${lastError?.message || 'Unknown error'}`);
  }
}
