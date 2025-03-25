// src/services/ApiHotel.js
import http from "../config/AxiosConfig";

const baseUrlHotel = "/api/hotels";

export class ApiHotel {
    static getHotels(params = {}) {
        return http({
            method: "GET",
            url: baseUrlHotel,
            params: {
                nameSearch: params.nameSearch || '',
                sortDescending: params.sortDescending !== undefined ? params.sortDescending : false,
                pageNumber: params.pageNumber || 1,
                pageSize: params.pageSize || 10
            }
        });
    }

    static getHotelById(id) {
        return http({
            method: "GET",
            url: `${baseUrlHotel}/${id}`
        });
    }

    static createHotel(hotelData) {
        return http({
            method: "POST",
            url: baseUrlHotel,
            data: hotelData
        });
    }

    static updateHotel(id, hotelData) {
        return http({
            method: "PUT",
            url: `${baseUrlHotel}/${id}`,
            data: hotelData
        });
    }

    static deleteHotel(id) {
        return http({
            method: "DELETE",
            url: `${baseUrlHotel}/${id}`
        });
    }
}