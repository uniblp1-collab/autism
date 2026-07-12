import { ListUsersUseCase } from "./list-users.use-case";
import { UserRepository } from "../../../auth/domain/user.repository";
import { User } from "../../../auth/domain/user.entity";

function buildUser(id: string): User {
  return new User(id, `${id}@example.com`, "hashed", "PARENT", true, new Date(), new Date());
}

describe("ListUsersUseCase", () => {
  let userRepository: jest.Mocked<UserRepository>;
  let useCase: ListUsersUseCase;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      setActive: jest.fn(),
      setPasswordHash: jest.fn(),
      findParents: jest.fn(),
    };
    useCase = new ListUsersUseCase(userRepository);
  });

  it("defaults to page 1 / pageSize 20 when the query is empty", async () => {
    userRepository.findParents.mockResolvedValue({ items: [buildUser("u1")], total: 1 });

    const result = await useCase.execute({});

    expect(userRepository.findParents).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    expect(result).toEqual({ items: [expect.any(User)], total: 1, page: 1, pageSize: 20 });
  });

  it("passes through explicit page/pageSize", async () => {
    userRepository.findParents.mockResolvedValue({ items: [], total: 0 });

    await useCase.execute({ page: 3, pageSize: 5 });

    expect(userRepository.findParents).toHaveBeenCalledWith({ page: 3, pageSize: 5 });
  });
});
