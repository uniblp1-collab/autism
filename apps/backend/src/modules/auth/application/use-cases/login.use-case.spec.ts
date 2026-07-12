import { LoginUseCase } from "./login.use-case";
import { UserRepository } from "../../domain/user.repository";
import { PasswordHasherPort } from "../../domain/password-hasher.port";
import { User } from "../../domain/user.entity";
import { AccountBlockedException, InvalidCredentialsException } from "../../domain/invalid-credentials.exception";

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

describe("LoginUseCase", () => {
  let userRepository: jest.Mocked<UserRepository>;
  let passwordHasher: jest.Mocked<PasswordHasherPort>;
  let useCase: LoginUseCase;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      setActive: jest.fn(),
      setPasswordHash: jest.fn(),
      findParents: jest.fn(),
    };
    passwordHasher = { hash: jest.fn(), compare: jest.fn() };
    useCase = new LoginUseCase(userRepository, passwordHasher);
  });

  it("returns the user when credentials match and the account is active", async () => {
    const user = buildUser({ isActive: true });
    userRepository.findByEmail.mockResolvedValue(user);
    passwordHasher.compare.mockResolvedValue(true);

    const result = await useCase.execute({ email: "parent@example.com", password: "correct" });

    expect(result).toBe(user);
  });

  it("throws InvalidCredentialsException when the email is unknown", async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(useCase.execute({ email: "missing@example.com", password: "x" })).rejects.toThrow(
      InvalidCredentialsException,
    );
  });

  it("throws InvalidCredentialsException when the password does not match", async () => {
    userRepository.findByEmail.mockResolvedValue(buildUser());
    passwordHasher.compare.mockResolvedValue(false);

    await expect(useCase.execute({ email: "parent@example.com", password: "wrong" })).rejects.toThrow(
      InvalidCredentialsException,
    );
  });

  it("throws AccountBlockedException when the account is blocked, even with correct credentials", async () => {
    userRepository.findByEmail.mockResolvedValue(buildUser({ isActive: false }));
    passwordHasher.compare.mockResolvedValue(true);

    await expect(useCase.execute({ email: "parent@example.com", password: "correct" })).rejects.toThrow(
      AccountBlockedException,
    );
  });
});
