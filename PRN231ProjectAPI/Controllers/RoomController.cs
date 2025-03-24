using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using PRN231ProjectAPI.DTOs.Common;
using PRN231ProjectAPI.DTOs.Room;
using PRN231ProjectAPI.Exceptions;
using PRN231ProjectAPI.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PRN231ProjectAPI.Controllers
{
    [Route("api/rooms")]
    [ApiController]
    public class RoomController : ControllerBase
    {
        private readonly RoomService _roomService;

        public RoomController(RoomService roomService)
        {
            _roomService = roomService;
        }

        [HttpGet]
        [EnableQuery(PageSize = 10)]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<RoomResponseDTO>>), StatusCodes.Status200OK)]
        public IActionResult GetRooms()
        {
            try
            {
                var roomDTOs = _roomService.GetRooms();
                return Ok(new ApiResponse<IQueryable<RoomResponseDTO>>(roomDTOs));
            }
            catch (Exception ex)
            {
                throw new InternalServerException($"Error retrieving rooms: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<RoomResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetRoom(Guid id)
        {
            try
            {
                var roomDto = await _roomService.GetRoomById(id);
                return Ok(new ApiResponse<RoomResponseDTO>(roomDto));
            }
            catch (NotFoundException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new InternalServerException($"Error retrieving room: {ex.Message}");
            }
        }

        [HttpGet("available")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<RoomResponseDTO>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> GetAvailableRooms([FromQuery] AvailabilityRequestDTO request)
        {
            try
            {
                var roomDtos = await _roomService.GetAvailableRooms(request);
                return Ok(new ApiResponse<IEnumerable<RoomResponseDTO>>(roomDtos));
            }
            catch (BadRequestException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new InternalServerException($"Error retrieving available rooms: {ex.Message}");
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<RoomResponseDTO>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> CreateRoom([FromBody] RoomCreateDTO request)
        {
            try
            {
                var roomDto = await _roomService.CreateRoom(request);
                return StatusCode(201, new ApiResponse<RoomResponseDTO>(201, "Room created successfully", roomDto));
            }
            catch (NotFoundException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new InternalServerException($"Error creating room: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<RoomResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateRoom(Guid id, [FromBody] RoomUpdateDTO request)
        {
            try
            {
                var roomDto = await _roomService.UpdateRoom(id, request);
                return Ok(new ApiResponse<RoomResponseDTO>(roomDto));
            }
            catch (NotFoundException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new InternalServerException($"Error updating room: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> DeleteRoom(Guid id)
        {
            try
            {
                await _roomService.DeleteRoom(id);
                return Ok(new ApiResponse<object>(200, "Room deleted successfully"));
            }
            catch (NotFoundException)
            {
                throw;
            }
            catch (ConflictException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new InternalServerException($"Error deleting room: {ex.Message}");
            }
        }
    }
}