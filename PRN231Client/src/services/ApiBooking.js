import http from "../config/AxiosConfig";

const baseUrlBooking = "/api/bookings";

export class ApiBooking {
    static getBookings(filter = {}) {
        return http({
            method: "GET",
            url: baseUrlBooking,
            params: filter
        });
    }

    static getBooking(id) {
        return http({
            method: "GET",
            url: `${baseUrlBooking}/${id}`
        });
    }

    static getMyBookings(filter = {}) {
        return http({
            method: "GET",
            url: `${baseUrlBooking}/my-bookings`,
            params: filter
        });
    }

    static createBooking(request) {
        return http({
            method: "POST",
            url: baseUrlBooking,
            data: request
        });
    }

    static updateBooking(id, request) {
        return http({
            method: "PUT",
            url: `${baseUrlBooking}/${id}`,
            data: request
        });
    }

    static cancelBooking(id) {
        return http({
            method: "DELETE",
            url: `${baseUrlBooking}/${id}`
        });
    }

    static processPaymentCallback(paymentParams) {
        return http({
            method: "GET",
            url: `${baseUrlBooking}/payment-callback`,
            params: paymentParams
        });
    }
    static getPaymentUrl(bookingId) {
        return http({
            method: "GET",
            url: `${baseUrlBooking}/${bookingId}/payment-url`
        });
    }
}