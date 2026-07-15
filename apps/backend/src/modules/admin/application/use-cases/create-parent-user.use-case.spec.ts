import { CreateParentUserUseCase } from "./create-parent-user.use-case";
import { UserRepository } from "../../../auth/domain/user.repository";
import { PasswordHasherPort } from "../../../auth/domain/password-hasher.port";
import { User } from "../../../auth/domain/user.entity";
import { EmailAlreadyRegisteredException } from "../../../auth/domain/invalid-credentials.exception";

function buildUser(overrides: Partial<User> = {}): User {
  return new User(
    overrides.id ?? "user-1",
    overrides.email ?? "new-parent@example.com",
    overrides.passwordHash ?? "hashed-temp",
    overrides.role ?? "PARENT",
    overrides.isActive ?? true,
    overrides.createdAt ?? new Date(),
    overrides.updatedAt ?? new Date(),
  );
}

describe("CreateParentUserUseCase", () => {
  let userRepository: jest.Mocked<UserRepository>;
  let passwordHasher: jest.Mocked<PasswordHasherPort>;
  let useCase: CreateParentUserUseCase;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      setActive: jest.fn(),
      setPasswordHash: jest.fn(),
      findParents: jest.fn(),
    };
    passwordHasher = { hash: jest.fn().mockResolvedValue("hashed-temp"), compare: jest.fn() };
    useCase = new CreateParentUserUseCase(userRepository, passwordHasher);
  });

  it("creates a PARENT account with a generated temporary password, returned once", async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockResolvedValue(buildUser());

    const result = await useCase.execute("new-parent@example.com");

    expect(result.temporaryPassword).toHaveLength(12);
    expect(passwordHasher.hash).toHaveBeenCalledWith(result.temporaryPassword);
    expect(userRepository.create).toHaveBeenCalledWith({
      email: "new-parent@example.com",
      passwordHash: "hashed-temp",
      role: "PARENT",
    });
    expect(result.user.email).toBe("new-parent@example.com");
  });

  it("refuses to create an account when the email is already registered", async () => {
    userRepository.findByEmail.mockResolvedValue(buildUser());

    await expect(useCase.execute("new-parent@example.com")).rejects.toThrow(EmailAlreadyRegisteredException);
    expect(userRepository.create).not.toHaveBeenCalled();
  });
});
