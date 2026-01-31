import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { Public } from "./decorators/public.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Register new user",
    description:
      "Creates a new user account with email and password. Sends verification email.",
  })
  @ApiResponse({
    status: 201,
    description: "User registered successfully",
    schema: {
      example: {
        user: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          email: "user@example.com",
          name: "John Doe",
          role: "user",
          createdAt: "2024-01-14T10:00:00Z",
        },
        tokens: {
          accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          expiresIn: 3600,
          tokenType: "Bearer",
        },
        message:
          "Registration successful. Please check your email for verification.",
      },
    },
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 409, description: "Email already registered" })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Login user",
    description: "Authenticates user and returns JWT tokens",
  })
  @ApiResponse({
    status: 200,
    description: "User logged in successfully",
    schema: {
      example: {
        user: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          email: "user@example.com",
          name: "John Doe",
          role: "user",
          lastLogin: "2024-01-14T10:00:00Z",
        },
        tokens: {
          accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          expiresIn: 3600,
          tokenType: "Bearer",
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Refresh access token",
    description: "Obtains a new access token using a valid refresh token",
  })
  @ApiResponse({
    status: 200,
    description: "Token refreshed successfully",
    schema: {
      example: {
        accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        expiresIn: 3600,
        tokenType: "Bearer",
      },
    },
  })
  @ApiResponse({ status: 401, description: "Invalid refresh token" })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Logout user",
    description: "Invalidates the current session",
  })
  @ApiResponse({ status: 200, description: "User logged out successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async logout(@CurrentUser("sub") userId: string) {
    await this.authService.logout(userId);
    return { message: "Logged out successfully" };
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get current user profile",
    description: "Returns the authenticated user's profile information",
  })
  @ApiResponse({
    status: 200,
    description: "User profile retrieved successfully",
    schema: {
      example: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "user@example.com",
        name: "John Doe",
        role: "user",
        createdAt: "2024-01-14T10:00:00Z",
        lastLogin: "2024-01-14T10:00:00Z",
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getProfile(@CurrentUser("id") userId: string) {
    return this.authService.getUserById(userId);
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Request password reset",
    description: "Sends a password reset email to the user",
  })
  @ApiResponse({
    status: 200,
    description: "Password reset email sent",
    schema: {
      example: {
        message: "If the email exists, a password reset link has been sent",
      },
    },
  })
  async forgotPassword(@Body("email") email: string) {
    return this.authService.requestPasswordReset(email);
  }
}
