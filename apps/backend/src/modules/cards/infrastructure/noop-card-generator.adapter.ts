import { Injectable } from "@nestjs/common";
import { CardDraft, CardGeneratorPort, CardGenerationRequest } from "../domain/card-generator.port";

/**
 * MVP-заглушка порта AI-генерации карточек (ARCHITECTURE.md §5).
 * В Phase 2/3 заменяется реальным адаптером (например, вызовом LLM) без изменения
 * use-case'ов и контроллеров, которые зависят только от CardGeneratorPort.
 */
@Injectable()
export class NoopCardGeneratorAdapter implements CardGeneratorPort {
  generateCard(_prompt: CardGenerationRequest): Promise<CardDraft> {
    throw new Error("AI-генерация карточек недоступна в MVP (Phase 2/3)");
  }
}
