export interface CardGroup {
  name: string;
  color1: string;
  color2: string;
}

export interface CardWeights {
  performance: number;
  sense: number;
  technique: number;
}

export interface Card {
  id: string;
  name: string;
  character: string;
  characterId: string;
  rarity: number;
  attribute: number;
  attributeName: string; // 예: "Happy"
  attributeIcon: string;
  group: CardGroup;
  groups: CardGroup[];
  weights: CardWeights;
  thumb: string;
  image: string;
  maxLevel: number;
  maxBloom: number;
  maxStat: string;
}

export interface CardDataResponse {
  cards: Record<string, Card>; // JSON이 객체 형태로 키(0, 100...)를 가지므로 Record로 정의
  bloomGroups: Record<string, number[]>;
  levelGroups: Record<string, number[]>;
}