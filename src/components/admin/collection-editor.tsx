'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'number' | 'switch' | 'select' | 'image';
  options?: { value: string; label: string }[];
  wide?: boolean;
  dir?: 'ltr' | 'rtl';
}

interface Props<T extends { id: string }> {
  isAr: boolean;
  items: T[];
  onChange: (items: T[]) => void;
  fields: FieldDef[];
  newItem: () => T;
  titleOf: (item: T) => string;
  subtitleOf?: (item: T) => React.ReactNode;
  addLabel?: string;
  emptyLabel?: string;
  sortable?: boolean;
}

/** Generic CRUD list used by the admin content tabs */
export function CollectionEditor<T extends { id: string }>({
  isAr, items, onChange, fields, newItem, titleOf, subtitleOf, addLabel, emptyLabel, sortable,
}: Props<T>) {
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const update = (id: string, key: string, value: unknown) =>
    onChange(items.map(it => it.id === id ? { ...it, [key]: value } : it));

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...items];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const handleAdd = () => {
    const item = newItem();
    onChange([item, ...items]);
    setOpenId(item.id);
  };

  const visible = items.filter(it => titleOf(it).toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-4 rounded-[2rem] shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder={isAr ? 'بحث...' : 'Search...'} className="ps-10 rounded-xl h-11" />
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="rounded-lg">{items.length}</Badge>
          <Button onClick={handleAdd} className="dm-gradient-primary rounded-full px-6 font-black gap-2"><Plus size={16} />{addLabel || (isAr ? 'إضافة' : 'Add')}</Button>
        </div>
      </div>

      {visible.length === 0 && (
        <Card className="rounded-[2rem] border-none shadow-sm bg-white p-10 text-center text-slate-400 font-bold text-sm">{emptyLabel || (isAr ? 'لا توجد عناصر' : 'No items')}</Card>
      )}

      {visible.map(item => {
        const idx = items.indexOf(item);
        const open = openId === item.id;
        return (
          <Card key={item.id} className={cn('rounded-[2rem] border-none shadow-sm bg-white overflow-hidden transition-shadow', open && 'shadow-xl ring-2 ring-accent/30')}>
            <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setOpenId(open ? null : item.id)}>
              {sortable && (
                <div className="flex flex-col" onClick={e => e.stopPropagation()}>
                  <button onClick={() => move(idx, -1)} className="text-slate-300 hover:text-primary" aria-label="up"><ChevronUp size={16} /></button>
                  <button onClick={() => move(idx, 1)} className="text-slate-300 hover:text-primary" aria-label="down"><ChevronDown size={16} /></button>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm truncate">{titleOf(item) || <span className="text-slate-300">{isAr ? '(بدون عنوان)' : '(untitled)'}</span>}</p>
                {subtitleOf && <div className="text-[11px] text-slate-400 font-bold truncate">{subtitleOf(item)}</div>}
              </div>
              <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); onChange(items.filter(x => x.id !== item.id)); }} className="text-red-400 hover:bg-red-50 rounded-xl"><Trash2 size={16} /></Button>
            </div>

            {open && (
              <div className="grid md:grid-cols-2 gap-4 p-6 pt-2 border-t border-slate-100">
                {fields.map(f => {
                  const value = (item as Record<string, unknown>)[f.key];
                  return (
                    <div key={f.key} className={cn('space-y-1', (f.wide || f.type === 'textarea') && 'md:col-span-2')}>
                      <Label className="text-xs font-bold text-slate-500">{f.label}</Label>
                      {f.type === 'switch' ? (
                        <div className="h-10 flex items-center"><Switch checked={!!value} onCheckedChange={v => update(item.id, f.key, v)} /></div>
                      ) : f.type === 'textarea' ? (
                        <Textarea value={(value as string) ?? ''} dir={f.dir} onChange={e => update(item.id, f.key, e.target.value)} className="rounded-xl min-h-[110px]" />
                      ) : f.type === 'select' ? (
                        <Select value={(value as string) ?? ''} onValueChange={v => update(item.id, f.key, v)}>
                          <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                          <SelectContent>{f.options?.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : (
                        <div className="flex gap-3 items-center">
                          <Input
                            type={f.type === 'number' ? 'number' : 'text'}
                            dir={f.dir ?? (f.type === 'image' ? 'ltr' : undefined)}
                            value={(value as string | number) ?? ''}
                            onChange={e => update(item.id, f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                            className="rounded-xl h-10"
                          />
                          {f.type === 'image' && typeof value === 'string' && value && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={value} alt="" className="size-10 rounded-lg object-cover border" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
