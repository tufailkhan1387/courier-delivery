import { CURRENT_CUSTOMER_ID } from '@/data/session'
import { useQuery } from '@/hooks/useQuery'
import { addressService, customerService, paymentService, pricingService, shipmentService, ticketService } from '@/services'

/** The signed-in demo customer's profile. */
export function useCurrentCustomer() {
  return useQuery(() => customerService.getById(CURRENT_CUSTOMER_ID), [])
}

/** All shipments booked by the signed-in demo customer, newest first. */
export function useMyShipments() {
  return useQuery(() => shipmentService.listByCustomer(CURRENT_CUSTOMER_ID), [])
}

/** The signed-in demo customer's address book. */
export function useMyAddresses() {
  return useQuery(() => addressService.list(CURRENT_CUSTOMER_ID), [])
}

/** Invoices / payment records for the signed-in demo customer. */
export function useMyPayments() {
  return useQuery(() => paymentService.list(CURRENT_CUSTOMER_ID), [])
}

/** Support tickets raised by the signed-in demo customer. */
export function useMyTickets() {
  return useQuery(() => ticketService.list(CURRENT_CUSTOMER_ID), [])
}

/** Rate cards + finance config, for synchronous quote previews. */
export function usePricingData() {
  return useQuery(() => pricingService.getPricingData(), [])
}
