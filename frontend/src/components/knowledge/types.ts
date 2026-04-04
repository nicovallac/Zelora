import type { KBArticleApiItem, KBDocumentApiItem } from '../../services/api';

export type KnowledgeKind = 'entrada' | 'link' | 'archivo';

export interface KnowledgeListItem {
  id: string;
  kind: KnowledgeKind;
  title: string;
  preview: string;
  content?: string;
  processingStatus?: KBDocumentApiItem['processing_status'];
  updatedAt: string;
  rawArticle?: KBArticleApiItem;
  rawDocument?: KBDocumentApiItem;
}
