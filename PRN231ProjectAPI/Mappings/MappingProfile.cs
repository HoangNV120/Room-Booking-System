using AutoMapper;
using PRN231ProjectAPI.DTOs.Auth;
using PRN231ProjectAPI.DTOs.Booking;
using PRN231ProjectAPI.DTOs.Hotel;
using PRN231ProjectAPI.DTOs.Payment;
using PRN231ProjectAPI.DTOs.Room;
using PRN231ProjectAPI.Models;

namespace PRN231ProjectAPI.Mappings
{
    public class MappingProfile : Profile
    {

        public MappingProfile()
        {
            CreateMap<SignUpRequestDTO, User>()
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore());
            CreateMap<User, SignUpResponseDTO>();
            
            CreateMap<Room, RoomResponseDTO>()
                .ForMember(dest => dest.HotelName, opt => opt.MapFrom(src => src.Hotel.Name))
                .ForMember(dest => dest.ImageUrl, opt => opt.MapFrom(src => src.ImageUrl));
    
            CreateMap<RoomCreateDTO, Room>();
            CreateMap<RoomUpdateDTO, Room>();

            CreateMap<Hotel, HotelResponseDTO>()
                .ForMember(dest => dest.ImageUrl, opt => opt.MapFrom(src => src.ImageUrl));
            CreateMap<HotelCreateDTO, Hotel>();
            CreateMap<HotelUpdateDTO, Hotel>();
            
            
            // Add Booking mappings
            CreateMap<Booking, BookingResponseDTO>()
                .ForMember(dest => dest.RoomType, opt => opt.MapFrom(src => src.Room.RoomType))
                .ForMember(dest =>dest.RoomName, opt => opt.MapFrom(src => src.Room.RoomName))
                .ForMember(dest => dest.HotelName, opt => opt.MapFrom(src => src.Room.Hotel.Name))
                .ForMember(dest => dest.HotelAddress, opt => opt.MapFrom(src => src.Room.Hotel.Address))
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.User.FullName))
                .ForMember(dest => dest.HotelId, opt => opt.MapFrom(src => src.Room.HotelId));
            
        }
    }
}
