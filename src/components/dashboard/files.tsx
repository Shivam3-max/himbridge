'use client';

import { useRouter } from 'next/navigation';
import { deleteFile, uploadFiles } from '@/actions/trade';
import { fileSize, type FileKind } from '@/domain/files';
import { useT } from '@/i18n/client';
import { Dropzone, SubmitButton, useCommand, useFormAction } from '../ui/forms';

export interface FileChipData {
  id: number;
  name: string;
  mime: string;
  label?: string;
  size?: number;
}

/** Thumbnail / PDF badge + link to an uploaded file, optionally removable. */
export function FileChip({ file, removable = false }: { file: FileChipData; removable?: boolean }) {
  const t = useT();
  const router = useRouter();
  const cmd = useCommand();
  const isImg = file.mime.startsWith('image/');
  return (
    <span className="fchip">
      {/* eslint-disable-next-line @next/next/no-img-element -- permission-checked file route */}
      {isImg ? <img src={`/files/${file.id}`} alt="" /> : <span className="fic">PDF</span>}
      <a href={`/files/${file.id}`} target="_blank" rel="noopener">
        {file.label ? `${t(file.label)} — ` : ''}
        {file.name}
      </a>
      {file.size ? <span className="tiny muted">{fileSize(file.size)}</span> : null}
      {removable && (
        <button
          type="button"
          className="fdel"
          aria-label={`${t('Remove')} ${file.name}`}
          disabled={cmd.busy}
          onClick={() => cmd.run(() => deleteFile(file.id), { confirm: 'Remove this file?', onSuccess: () => router.refresh() })}
        >
          ×
        </button>
      )}
    </span>
  );
}

export function FileList({ files, removable = false }: { files: FileChipData[]; removable?: boolean }) {
  if (!files.length) return null;
  return (
    <div className="files">
      {files.map((f) => (
        <FileChip key={f.id} file={f} removable={removable} />
      ))}
    </div>
  );
}

/** Upload form with a label picker. Each option value is "kind|label". */
export function UploadForm({
  refId,
  options,
  button = 'Upload',
  buttonClass = 'btn sm',
  fixedKind,
}: {
  refId?: number;
  options: [kind: FileKind, label: string][];
  button?: string;
  buttonClass?: string;
  fixedKind?: FileKind;
}) {
  const t = useT();
  const router = useRouter();
  const f = useFormAction(uploadFiles, {
    toastErrors: true,
    onSuccess: () => router.refresh(),
    validate: (fd) => (fd.getAll('files').some((v) => v instanceof File && v.size > 0) ? null : 'Choose at least one file'),
  });
  return (
    <form
      onSubmit={(e) => {
        // The select holds "kind|label"; split it into the two fields the action expects.
        const form = e.currentTarget;
        const [kind, label] = (form.elements.namedItem('pick') as HTMLSelectElement).value.split('|');
        (form.elements.namedItem('kind') as HTMLInputElement).value = fixedKind ?? kind ?? '';
        (form.elements.namedItem('label') as HTMLInputElement).value = label ?? '';
        f.onSubmit(e);
      }}
      style={{ marginBottom: 12 }}
    >
      <input type="hidden" name="kind" />
      <input type="hidden" name="label" />
      {refId != null && <input type="hidden" name="refId" value={refId} />}
      <div className="grid-form" style={{ marginBottom: 6 }}>
        <select name="pick" aria-label={t('Document type')}>
          {options.map(([kind, label]) => (
            <option key={`${kind}|${label}`} value={`${kind}|${label}`}>
              {t(label)}
            </option>
          ))}
        </select>
      </div>
      <Dropzone name="files" />
      <SubmitButton pending={f.pending} className={buttonClass} style={{ marginTop: 6 }}>
        {button}
      </SubmitButton>
    </form>
  );
}
