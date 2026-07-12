import { SetUserActiveUseCase } from "./set-user-active.use-case";
import { UserRepository } from "../../../auth/domain/user.repository";
import { User } from "../../../auth/domain/user.entity";
import { EntityNotFoundException } from "../../../../common/exceptions/domain.exception";
import { OnlyParentAccountsManageableException } from "../only-parent-accounts.exception";

function buildUser(role: User["role"] = "PARENT", isActive = true): User {
  return new User("user-1", "parent@example.com", "hashed", role, isActive, new Date(), new Date());
}

describe("SetUserActiveUseCase", () => {
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: SetUserActiveUseCase;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      setActive: jest.fn(),
      setPasswordHash: jest.fn(),
      findParents: jest.fn(),
    };
    useCase = new SetUserActiveUseCase(userRepository);
  });

  it("blocks a parent account", async () => {
    userRepository.findById.mockResolvedValue(buildUser("PARENT", true));
    userRepository.setActive.mockResolvedValue(buildUser("PARENT", false));

    const result = await useCase.execute("user-1", false);

    expect(userRepository.setActive).toHaveBeenCalledWith("user-1", false);
    expect(result.isActive).toBe(false);
  });

  it("throws when the user does not exist", async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute("missing", false)).rejects.toThrow(EntityNotFoundException);
    expect(userRepository.setActive).not.toHaveBeenCalled();
  });

  it("throws when targeting a non-parent account", async () => {
    userRepository.findById.mockResolvedValue(buildUser("ADMIN", true));

    await expect(useCase.execute("user-1", false)).rejects.toThrow(OnlyParentAccountsManageableException);
    expect(userRepository.setActive).not.toHaveBeenCalled();
  });
});
