import { useState } from 'react';
import { Copy } from 'lucide-react';
import { importAiRecords, outcome, OUTCOME_LABELS, type TrackerData } from './model';
import { Modal } from './components';

export const AI_PROMPT = `请将我提供的招聘投递记录整理成 JSON 数组。只输出合法 JSON，不要解释。
格式：[ { "companyName":"公司名称", "website":"招聘官网基础地址", "appliedAt":"YYYY-MM-DD", "position":"岗位名称，不确定填写待设置岗位", "status":"active | completed | offer | rejected | withdrawn", "currentStage":"当前阶段", "completedStages":[], "note":"备注" } ]
默认流程：简历初筛、笔试、一面、二面、三面、HR面、意向、offer。删除 URL 查询参数和推荐参数；不确定的信息写入 note；不要生成 id、companyId、createdAt、updatedAt、stages、template。
以下是我的原始招聘记录：
[把记录粘贴到这里]`;

export interface IAiImportCardProps {
  data: TrackerData;
  onImport: (next: TrackerData) => void;
}

/**
 * 新增投递弹窗中的 AI 批量导入卡片，负责复制提示词、解析 JSON 和确认追加记录。
 */
export function AiImportCard({ data, onImport }: IAiImportCardProps) {
  const [raw, setRaw] = useState('');
  const [preview, setPreview] = useState<TrackerData | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const added = preview?.applications.slice(data.applications.length) ?? [];
  return (
    <>
      <details className="tracker-ai-card" open>
        <summary>
          <span>AI 批量整理投递记录</span>
          <small>复制提示词，粘贴 AI 返回的 JSON</small>
        </summary>
        <div className="tracker-collapse-content">
          <div className="tracker-ai-card-body">
            <div className="tracker-ai-block">
              <div className="tracker-ai-block-head">
                <span>固定提示词</span>
                <button
                  type="button"
                  className="tracker-text-button"
                  onClick={() => {
                    void navigator.clipboard.writeText(AI_PROMPT);
                    setCopied(true);
                  }}
                >
                  <Copy size={14} />
                  {copied ? '已复制' : '复制提示词'}
                </button>
              </div>
              <textarea
                className="tracker-ai-card-prompt"
                value={AI_PROMPT}
                readOnly
                aria-label="AI 提示词"
              />
            </div>
            <div className="tracker-ai-block">
              <div className="tracker-ai-block-head">
                <span>AI 返回的 JSON</span>
                <small>只支持 JSON 数组</small>
              </div>
              <textarea
                className="tracker-ai-import-input"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                placeholder="把 AI 返回的 JSON 数组粘贴到这里"
                aria-label="AI JSON"
              />
              {error && <p className="tracker-error">{error}</p>}
              <button
                type="button"
                className="tracker-button"
                onClick={() => {
                  try {
                    setError('');
                    setPreview(importAiRecords(raw, data));
                  } catch (cause) {
                    setError((cause as Error).message);
                  }
                }}
              >
                解析并预览
              </button>
            </div>
          </div>
        </div>
      </details>
      {preview && (
        <Modal
          title="确认追加投递记录"
          subtitle={`共 ${added.length} 条记录`}
          onClose={() => setPreview(null)}
          wide
        >
          <div className="tracker-ai-preview">
            {added.map((a) => {
              const company = preview.companies.find((c) => c.id === a.companyId);
              return (
                <div key={a.id}>
                  <strong>{company?.name}</strong>
                  <span>{a.position}</span>
                  <span>{a.appliedAt}</span>
                  <span>{a.stages.find((s) => s.status === 'active')?.name ?? '流程完成'}</span>
                  <span>{OUTCOME_LABELS[outcome(a)]}</span>
                </div>
              );
            })}
          </div>
          <div className="tracker-actions">
            <button type="button" className="tracker-button" onClick={() => setPreview(null)}>
              取消
            </button>
            <button
              type="button"
              className="tracker-button primary"
              onClick={() => {
                onImport(preview);
                setPreview(null);
              }}
            >
              确认追加
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
