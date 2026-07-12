import { UnauthorizedException } from "@nestjs/common";
import { RefreshTokenUseCase } from "./refresh-token.use-case";
import { UserRepository } from "../../domain/user.repository";
import { User } from "../../domain/user.entity";

function buildUser(overrides: Partial<{ isActive: boolean }> = {}): User {
  return new User(
    "user-1",
    "parent@example.com",
    "hashed",
    "PARENT",
    overrides.isActive ?? true,
    new Date(),
    new Date(),
  );
}

describe("RefreshTokenUseCase", () => {
  let userRepository: jest.Mocked<UserRepository>;
  let jwtService: { verifyAsync: jest.Mock };
  let configService: { get: jest.Mock };
  let useCase: RefreshTokenUseCase;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      setActive: jest.fn(),
      setPasswordHash: jest.fn(),
      findParents: jest.fn(),
    };
    jwtService = { verifyAsync: jest.fn().mockResolvedValue({ sub: "user-1", email: "parent@example.com", role: "PARENT" }) };
    configService = { get: jest.fn().mockReturnValue("dev-refresh-secret") };
    useCase = new RefreshTokenUseCase(userRepository, jwtService as any, configService as any);
  });

  it("returns the user for a valid refresh token when the account is active", async () => {
    const user = buildUser({ isActive: true });
    userRepository.findById.mockResolvedValue(user);

    const result = await useCase.execute("valid-token");

    expect(result).toBe(user);
  });

  it("throws UnauthorizedException when the token cannot be verified", async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error("invalid"));

    await expect(useCase.execute("bad-token")).rejects.toThrow(UnauthorizedException);
    expect(userRepository.findById).not.toHaveBeenCalled();
  });

  it("throws UnauthorizedException when the user no longer exists", async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute("valid-token")).rejects.toThrow(UnauthorizedException);
  });

  it("throws UnauthorizedException when the account has been blocked since the token was issued", async () => {
    userRepository.findById.mockResolvedValue(buildUser({ isActive: false }));

    await expect(useCase.execute("valid-token")).rejects.toThrow(UnauthorizedException);
  });
});
