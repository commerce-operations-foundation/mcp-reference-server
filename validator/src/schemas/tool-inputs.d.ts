/**
 * Type declarations for the @onx/schemas package
 */

declare module '@onx/schemas' {
  export const ONX_TOOLS: readonly string[];
  export const toolInputSchemas: Map<string, unknown>;
  export function getToolInputSchema(toolName: string): unknown | null;
}
