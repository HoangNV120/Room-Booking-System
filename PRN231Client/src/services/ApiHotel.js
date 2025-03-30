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

    static createHotel(request) {
        const formData = new FormData();

        // Add hotel data to FormData
        formData.append("name", request.name);
        formData.append("address", request.address);
        formData.append("description", request.description);

        // Add image if present
        if (request.image) {
            formData.append("image", request.image);
        }

        return http({
            method: "POST",
            url: baseUrlHotel,
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }

    static updateHotel(id, request) {
        const formData = new FormData();

        // Add hotel data to FormData
        formData.append("name", request.name);
        formData.append("address", request.address);
        formData.append("description", request.description);

        // Add image if present
        if (request.image) {
            formData.append("image", request.image);
        }

        return http({
            method: "PUT",
            url: `${baseUrlHotel}/${id}`,
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }

    static deleteHotel(id) {
        return http({
            method: "DELETE",
            url: `${baseUrlHotel}/${id}`
        });
    }
}