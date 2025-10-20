for updatedAtMin/Max, pageSize, createdAtMin/Max, and skip, move those into a shared file and import them.

delete server/src/types/fulfillment.ts and replace with inferred types from the schemas.

all zod schemas should by the type name + "Schema" e.g. GetCustomersInputSchema, UpdateOrderInputSchema, etc.
for tool input schemas, whenever possible, use schemas from the entities folder so you don't have to repeat yourself. look at server/src/schemas/tool-inputs/actions/update-order.ts as an example

server/src/services/query-service.ts should be updated to reflect the new tool schemas. identify and address any inconsistencies in the method signatures e.g. getOrder should be getOrders and the parameter should be updated with GetOrdersInput
