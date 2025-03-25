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
        return http({
            method: "POST",
            url: baseUrlRoom,
            data: request
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