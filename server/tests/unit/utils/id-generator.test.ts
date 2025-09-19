import { IdGenerator } from '../../../src/utils/id-generator';

describe('IdGenerator', () => {
  beforeEach(() => {
    // Reset counters for sequential IDs
    (IdGenerator as any).counters = new Map();
  });

  describe('uuid', () => {
    it('should generate valid UUID v4', () => {
      const uuid = IdGenerator.uuid();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = IdGenerator.uuid();
      const uuid2 = IdGenerator.uuid();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('orderId', () => {
    it('should generate order ID with correct format', () => {
      const orderId = IdGenerator.orderId();
      expect(orderId).toMatch(/^ORD-\d{14}-[A-Z0-9]{4}$/);
    });

    it('should generate unique order IDs', () => {
      const orderId1 = IdGenerator.orderId();
      const orderId2 = IdGenerator.orderId();
      expect(orderId1).not.toBe(orderId2);
    });
  });

  describe('shipmentId', () => {
    it('should generate shipment ID with correct format', () => {
      const shipmentId = IdGenerator.shipmentId();
      expect(shipmentId).toMatch(/^SHP-\d{14}-[A-Z0-9]{4}$/);
    });

    it('should generate unique shipment IDs', () => {
      const shipmentId1 = IdGenerator.shipmentId();
      const shipmentId2 = IdGenerator.shipmentId();
      expect(shipmentId1).not.toBe(shipmentId2);
    });
  });

  describe('rmaNumber', () => {
    it('should generate RMA number with correct format', () => {
      const rmaNumber = IdGenerator.rmaNumber();
      expect(rmaNumber).toMatch(/^RMA-\d{14}-[A-Z0-9]{4}$/);
    });

    it('should generate unique RMA numbers', () => {
      const rmaNumber1 = IdGenerator.rmaNumber();
      const rmaNumber2 = IdGenerator.rmaNumber();
      expect(rmaNumber1).not.toBe(rmaNumber2);
    });
  });

  describe('reservationId', () => {
    it('should generate reservation ID with correct format', () => {
      const reservationId = IdGenerator.reservationId();
      expect(reservationId).toMatch(/^RSV-[A-Z0-9]{8}$/);
    });

    it('should generate unique reservation IDs', () => {
      const reservationId1 = IdGenerator.reservationId();
      const reservationId2 = IdGenerator.reservationId();
      expect(reservationId1).not.toBe(reservationId2);
    });
  });

  describe('sequential', () => {
    it('should generate sequential IDs with correct format', () => {
      const id1 = IdGenerator.sequential('TEST');
      const id2 = IdGenerator.sequential('TEST');
      const id3 = IdGenerator.sequential('TEST');

      expect(id1).toBe('TEST-000001');
      expect(id2).toBe('TEST-000002');
      expect(id3).toBe('TEST-000003');
    });

    it('should maintain separate counters for different prefixes', () => {
      const idA1 = IdGenerator.sequential('A');
      const idB1 = IdGenerator.sequential('B');
      const idA2 = IdGenerator.sequential('A');
      const idB2 = IdGenerator.sequential('B');

      expect(idA1).toBe('A-000001');
      expect(idB1).toBe('B-000001');
      expect(idA2).toBe('A-000002');
      expect(idB2).toBe('B-000002');
    });

    it('should pad numbers correctly', () => {
      const prefix = 'NUM';
      for (let i = 1; i <= 10; i++) {
        const id = IdGenerator.sequential(prefix);
        const expectedPadding = String(i).padStart(6, '0');
        expect(id).toBe(`${prefix}-${expectedPadding}`);
      }
    });
  });

  describe('concurrent ID generation', () => {
    it('should generate unique IDs under concurrent access', async () => {
      const promises = Array.from({ length: 100 }, () =>
        Promise.resolve(IdGenerator.orderId())
      );
      
      const ids = await Promise.all(promises);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(100);
    });
  });
});