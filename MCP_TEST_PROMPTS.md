# Universal OMS MCP Server - Test Prompts

Copy and paste these prompts into Claude Desktop to test each MCP tool. The mock adapter has pre-populated test data you can reference.

## Test Data Reference

### Available Orders
- **order_001** / EXT-001: Status=confirmed, Customer=John Smith, Product=Wireless Bluetooth Headphones
- **order_002** / ORD-1001: Status=processing, Customer=Sarah Johnson, Product=Organic Cotton T-Shirt (qty 2)
- **order_003** / WEB-2024-1002: Status=shipped, Customer=John Smith, Product=Premium Coffee Beans (qty 3)

### Available Customers
- **cust_001**: John Smith (john.smith@example.com, VIP Gold)
- **cust_002**: Sarah Johnson (sarah.johnson@example.com)

### Available Products/SKUs
- **prod_001** / WID-001: Wireless Bluetooth Headphones ($199.99)
- **prod_002** / TSH-002: Organic Cotton T-Shirt ($29.99)
- **prod_003** / COF-003: Premium Coffee Beans ($24.99)

### Warehouse Locations
- WH001, WH002, WH003 (all have inventory for each product)

---

## Query Tools Test Prompts

### 1. Get Order Tool
```
Get me the details for order EXT-001
```
```
Show me order order_002 
```
```
What's the status of order ORD-1001?
```
```
Can you retrieve order WEB-2024-1002 and show me all details?
```

### 2. Get Customer Tool
```
Get customer information for cust_001
```
```
Show me the details for customer john.smith@example.com
```
```
Find customer cust_002
```
```
What information do you have on customer sarah.johnson@example.com?
```

### 3. Get Product Tool
```
Show me product details for SKU WID-001
```
```
Get information about product prod_002
```
```
What are the details for the coffee product COF-003?
```
```
Find product TSH-002 and show me all its attributes
```

### 4. Get Inventory Tool
```
Check inventory for SKU WID-001 at warehouse WH001
```
```
What's the available stock for TSH-002 in location WH002?
```
```
Show me inventory levels for COF-003 across all warehouses
```
```
Get inventory status for WID-001 at WH003
```

### 5. Get Shipment Tool
```
Get shipment details for order order_003
```
```
Show me the shipment information for order WEB-2024-1002
```
```
Check if order_001 has been shipped
```
```
Find shipment tracking for order EXT-001
```

### 6. Get Buyer Tool
```
Get buyer information for order order_001
```
```
Who is the buyer for order ORD-1001?
```
```
Show me the buyer details for order_002
```
```
Find the customer who placed order WEB-2024-1002
```

---

## Action Tools Test Prompts

### 7. Capture Order Tool
```
Create a new order for customer cust_001 with 2 units of WID-001 shipping to 123 Main St, New York, NY 10001
```
```
Capture an order for sarah.johnson@example.com with 1 TSH-002 and 2 COF-003 items
```
```
Place an order for customer cust_002 with product WID-001, quantity 1, shipping to 456 Oak Ave, Los Angeles, CA 90210
```

### 8. Cancel Order Tool
```
Cancel order order_001 due to customer request
```
```
Please cancel order EXT-001 - the customer changed their mind
```
```
Cancel order ORD-1001 because of inventory issues
```

### 9. Update Order Tool
```
Update order order_002 to change the quantity of TSH-002 to 3 units
```
```
Modify order EXT-001 to ship to 789 Broadway, New York, NY 10002 instead
```
```
Update order ORD-1001 with express shipping
```

### 10. Return Order Tool
```
Process a return for order order_003 - customer says the coffee tastes bad
```
```
Create a return for order WEB-2024-1002 with reason "damaged during shipping"
```
```
Return order order_001 because the headphones don't work
```

### 11. Exchange Order Tool
```
Exchange order order_001 - customer wants TSH-002 instead of WID-001
```
```
Process an exchange for order ORD-1001 - swap the t-shirt for coffee beans
```
```
Exchange the items in order_002 for different products
```

### 12. Ship Order Tool
```
Mark order order_001 as shipped with tracking number TRK123456789
```
```
Ship order EXT-001 via FedEx with tracking FDX987654321
```
```
Process shipment for order_002 using UPS tracking 1Z999AA10123456784
```

---

## Management Tools Test Prompts

### 13. Hold Order Tool
```
Put order order_001 on hold - waiting for payment verification
```
```
Hold order EXT-001 due to address verification needed
```
```
Place a hold on order_002 for customer service review
```
```
Release the hold on order ORD-1001
```

### 14. Split Order Tool
```
Split order order_002 so that 1 TSH-002 ships immediately and the other ships later
```
```
I need to split order_001 into two separate shipments
```
```
Divide order WEB-2024-1002 - send 2 coffee bags now and 1 later
```

### 15. Reserve Inventory Tool
```
Reserve 5 units of WID-001 from warehouse WH001
```
```
Hold 10 units of TSH-002 inventory at location WH002 for a special customer
```
```
Reserve 3 COF-003 from WH003 for upcoming order
```
```
Release the reservation on 2 units of WID-001 at WH001
```

---

## Complex Workflow Test Prompts

### Multi-Tool Operations
```
Get order order_001, then check inventory for all its items, and finally ship it with tracking ABC123
```
```
Find customer cust_002, show me all their orders, and then check product availability for TSH-002
```
```
Create a new order for john.smith@example.com with 2 WID-001, then put it on hold for payment verification
```

### Error Handling Tests
```
Get order INVALID_ORDER_ID
```
```
Cancel an order that doesn't exist: order_999
```
```
Check inventory for a non-existent SKU: FAKE-SKU-001
```
```
Get customer information for unknown@email.com
```

### Business Logic Tests
```
Cancel order order_003 (note: it's already shipped - should fail)
```
```
Ship order order_001 twice (should handle duplicate shipment)
```
```
Reserve 1000 units of WID-001 (likely exceeds available inventory)
```

---

## Notes for Testing

1. The mock adapter includes realistic delays (50-200ms) to simulate network latency
2. There's a 1% error rate configured to occasionally test error handling
3. All timestamps are automatically generated relative to current date
4. Custom fields are preserved and returned in responses
5. The mock data persists during the session but resets on server restart

## Expected Responses

- Successful queries should return detailed JSON objects with all fields
- Failed operations should return clear error messages with reasons
- The server logs to stderr, so you'll see debug information in the server console
- All tools validate required fields and will reject invalid requests

## Troubleshooting

If a tool doesn't work as expected:
1. Check that the order/customer/product ID exists in the test data
2. Verify the status allows the operation (e.g., can't ship an already shipped order)
3. Look for validation errors in the response
4. Check server logs for detailed error information