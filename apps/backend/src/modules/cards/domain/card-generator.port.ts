// Точка расширения под AI (Phase 2/3, см. ARCHITECTURE.md §5).
// В MVP реализуется NoOp-адаптером (infrastructure/noop-card-generator.adapter.ts).
// CreateCardUseCase не меняется при появлении реальной AI-реализации этого порта.

export const CARD_GENERATOR_PORT = Symbol("CARD_GENERATOR_PORT");

export interface CardGenerationRequest {
  categoryId: string;
  prompt: string;
  childId?: string;
}

export interface CardDraft {
  title: string;
  imageUrl: string;
  ttsText: string;
}

export interface CardGeneratorPort {
  generateCard(prompt: CardGenerationRequest): Promise<CardDraft>;
}
