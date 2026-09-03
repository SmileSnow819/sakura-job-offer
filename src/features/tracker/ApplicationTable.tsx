import { CompanyLogo } from './components';
import { currentStage, outcome, OUTCOME_LABELS, type Application, type Company } from './model';

interface ApplicationTableProps {
  records: { application: Application; company: Company }[];
  selected: string[];
  onSelect: (id: string) => void;
  onDetail: (id: string) => void;
}

export default function ApplicationTable({ records, selected, onSelect, onDetail }: ApplicationTableProps) {
  return <div className="tracker-table-wrap">
    <table className="tracker-table">
      <thead><tr>
        <th>选择</th><th>公司 / 岗位</th><th>投递日期</th><th>当前阶段</th><th>状态</th><th>最近更新</th><th>操作</th>
      </tr></thead>
      <tbody>{records.map(({ application, company }) => <tr key={application.id}>
        <td><input type="checkbox" aria-label={`选择${company.name} ${application.position}`} checked={selected.includes(application.id)} onChange={() => onSelect(application.id)} /></td>
        <td><div className="tracker-table-company"><CompanyLogo name={company.name} website={company.website} /><div><strong>{company.name}</strong><p>{application.position}</p></div></div></td>
        <td>{application.appliedAt}</td>
        <td>{currentStage(application)?.name ?? '流程已结束'}</td>
        <td><span className={`tracker-badge ${outcome(application)}`}>{OUTCOME_LABELS[outcome(application)]}{application.archived ? ' · 已归档' : ''}</span></td>
        <td>{new Date(application.updatedAt).toLocaleDateString('zh-CN')}</td>
        <td><button type="button" className="tracker-text-button" onClick={() => onDetail(application.id)}>查看详情</button></td>
      </tr>)}</tbody>
    </table>
  </div>;
}
