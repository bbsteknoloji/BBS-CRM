"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PremiumEmptyState } from "@/components/premium/premium-empty-state";
import { createCustomerTaskAction } from "@/actions/customers/task-actions";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from "@/lib/constants/customer";
import { format } from "@/lib/utils/date-format";
import type { TaskPriority, TaskStatus } from "@prisma/client";

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: Date | null;
  assignedTo: { firstName: string; lastName: string };
};

type UserOption = { id: string; name: string };

type Props = {
  customerId: string;
  tasks: Task[];
  users: UserOption[];
  canWrite: boolean;
  defaultAssigneeId: string;
};

export function CustomerTasksPanel({
  customerId,
  tasks,
  users,
  canWrite,
  defaultAssigneeId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      {canWrite ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Görev ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni görev</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("customerId", customerId);
                startTransition(async () => {
                  const res = await createCustomerTaskAction(fd);
                  if (res.success) {
                    toast.success("Görev oluşturuldu");
                    setOpen(false);
                  } else toast.error(res.error);
                });
              }}
            >
              <input type="hidden" name="customerId" value={customerId} />
              <div className="space-y-2">
                <Label htmlFor="title">Başlık *</Label>
                <Input id="title" name="title" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedToId">Atanan *</Label>
                <select
                  id="assignedToId"
                  name="assignedToId"
                  required
                  defaultValue={defaultAssigneeId}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Öncelik</Label>
                <select
                  id="priority"
                  name="priority"
                  defaultValue="MEDIUM"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {(
                    Object.entries(TASK_PRIORITY_LABELS) as [
                      TaskPriority,
                      string,
                    ][]
                  ).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueAt">Bitiş tarihi</Label>
                <Input id="dueAt" name="dueAt" type="datetime-local" />
              </div>
              <Button type="submit" disabled={pending}>
                Oluştur
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}

      {tasks.length === 0 ? (
        <PremiumEmptyState
          title="Görev Yok"
          description="Görev bulunmuyor."
        />
      ) : (
        <ul className="divide-y rounded-lg border">
          {tasks.map((t) => (
            <li key={t.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{t.title}</p>
                <Badge variant="outline">
                  {TASK_STATUS_LABELS[t.status]}
                </Badge>
                <Badge variant="secondary">
                  {TASK_PRIORITY_LABELS[t.priority]}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.assignedTo.firstName} {t.assignedTo.lastName}
                {t.dueAt
                  ? ` · ${format(t.dueAt, "datetime")}`
                  : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
