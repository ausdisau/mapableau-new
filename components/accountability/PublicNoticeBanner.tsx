type Notice = {
  publicId: string;
  noticeType: string;
  title: string;
  body: string;
  severity: string;
  isDemonstration: boolean;
};

export function PublicNoticeList({ notices }: { notices: Notice[] }) {
  if (notices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No current accountability notices.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {notices.map((notice) => (
        <li
          key={notice.publicId}
          className="rounded-lg border border-slate-200 bg-white p-4"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {notice.noticeType.replace(/_/g, " ")} · {notice.severity}
          </p>
          <h3 className="mt-1 font-heading font-semibold">{notice.title}</h3>
          <p className="mt-1 text-sm whitespace-pre-wrap">{notice.body}</p>
        </li>
      ))}
    </ul>
  );
}
