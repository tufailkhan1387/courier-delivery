// Single import surface for data access. Swap these exports for HTTP-backed
// implementations (same method signatures) when the NestJS API is available.
export { shipmentService, type CreateShipmentInput, type StatusUpdateOptions } from './mock/shipmentService'
export { customerService, branchService, staffService, driverService } from './mock/directoryService'
export { pricingService } from './mock/pricingService'
export { addressService, paymentService, ticketService, notificationService } from './mock/accountService'
export { manifestService, scanService, codService, type CreateManifestInput } from './mock/operationsService'
export { resetDb as resetDemoData } from './mock/db'
