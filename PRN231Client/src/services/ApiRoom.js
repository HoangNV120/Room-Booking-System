// src/services/ApiRoom.js
import http from "../config/AxiosConfig";

const baseUrlRoom = "/api/rooms";

export class ApiRoom {
    static getRooms(params = {}) {
        return http({
            method: "GET",
            url: baseUrlRoom,
            params: params
        });
    }

    static getRoomById(id) {
        return http({
            method: "GET",
            url: `${baseUrlRoom}/${id}`
        });
    }

    static getAvailableRooms(params = {}) {
        return http({
            method: "GET",
            url: `${baseUrlRoom}/available`,
            params: params
        });
    }

    static createRoom(request) {
        // Create a FormData object to handle file uploads
        const formData = new FormData();

        // Add text fields to the form data
        formData.append('hotelId', request.hotelId);
        formData.append('roomType', request.roomType);
        formData.append('price', request.price);

        // Add status if provided, otherwise it will default to "Available" on the server
        if (request.status) {
            formData.append('status', request.status);
        }

        // Add image file if provided
        if (request.image instanceof File) {
            formData.append('image', request.image);
        }

        return http({
            method: "POST",
            url: baseUrlRoom,
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }

    static updateRoom(id, request) {
        return http({
            method: "PUT",
            url: `${baseUrlRoom}/${id}`,
            data: request
        });
    }

    static deleteRoom(id) {
        return http({
            method: "DELETE",
            url: `${baseUrlRoom}/${id}`
        });
    }

    static getRoomsByHotelId(hotelId, params = {}) {
        return http({
            method: "GET",
            url: `${baseUrlRoom}/hotel/${hotelId}`,
            params: params
        });
    }
}