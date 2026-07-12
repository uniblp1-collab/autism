import { ResetUserPasswordUseCase } from "./reset-user-password.use-case";
import { UserRepository } from "../../../auth/domain/user.repository";
import { PasswordHasherPort } from "../../../auth/domain/password-hasher.port";
import { User } from "../../../auth/domain/user.entity";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";
import { OnlyParentAccountsManageableException } from "../only-parent-accounts.exception";

function buildUser(role: User["role"] = "PARENT"): User {
  return new User("user-1", "parent@example.com", "hashed", role, true, new Date(), new Date());
}

describe("ResetUserPasswordUseCase", () => {
  let userRepository: jest.Mocked<UserRepository>;
  let passwordHasher: jest.Mocked<PasswordHasherPort>;
  let useCase: ResetUserPasswordUseCase;

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
    useCase = new ResetUserPasswordUseCase(userRepository, passwordHasher);
  });

  it("generates and stores a hashed temporary password, returning the plaintext once", async () => {
    userRepository.findById.mockResolvedValue(buildUser());

    const result = await useCase.execute("user-1");

    expect(result.userId).toBe("user-1");
    expect(result.temporaryPassword).toHaveLength(12);
    expect(passwordHasher.hash).toHaveBeenCalledWith(result.temporaryPassword);
    expect(userRepository.setPasswordHash).toHaveBeenCalledWith("user-1", "hashed-temp");
  });

  it("throws when the user does not exist", async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute("missing")).rejects.toThrow(EntityNotFoundException);
    expect(userRepository.setPasswordHash).not.toHaveBeenCalled();
  });

  it("throws when targeting a non-parent account", async () => {
    userRepository.findById.mockResolvedValue(buildUser("SPECIALIST"));

    await expect(useCase.execute("user-1")).rejects.toThrow(OnlyParentAccountsManageableException);
    expect(userRepository.setPasswordHash).not.toHaveBeenCalled();
  });
});
