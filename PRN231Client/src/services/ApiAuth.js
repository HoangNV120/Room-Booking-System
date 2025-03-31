import http from "../config/AxiosConfig";

const baseUrlAuth = "/api/auth"; 

export class ApiAuth {
    static signUp(request) {
        return http({
            method: "POST",
            url: baseUrlAuth + "/signup",
            data: request,
        });
    }

    static signIn(request) {
        return http({
            method: "POST",
            url: baseUrlAuth + "/login",
            data: request,
        });
    }

    static refreshToken(request) {
        return http({
            method: "POST",
            url: baseUrlAuth + "/refresh",
            data: request,
        });
    }

    static logout(request) {
        return http({
            method: "POST",
            url: baseUrlAuth + "/logout",
            data: request,
        });
    }

    static googleLogin(request) {
        return http({
            method: "POST",
            url: baseUrlAuth + "/google-login",
            data: request,
        });
    }
    
    static userInfo(){
        return http({
            method: "GET",
            url: baseUrlAuth + "/user-info",
        });
    }

    static verify(request) {
        return http({
            method: "POST",
            url: baseUrlAuth + "/verify",
            data: request,
        });
    }
    static forgotPassword(request) {
        return http({
            method: "POST",
            url: baseUrlAuth + "/forgot-password",
            data: request,
        });
    }

    static resetPassword(request) {
        return http({
            method: "POST",
            url: baseUrlAuth + "/reset-password",
            data: request,
        });
    }

    static getUsers(params) {
        return http({
            method: "GET",
            url: baseUrlAuth + "/users",
            params: params,
        });
    }
}