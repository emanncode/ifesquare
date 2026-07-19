import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Users, History, UserCircle } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { TabsList } from "@/components/ui/TabsList";
import { TabsTrigger } from "@/components/ui/TabsTrigger";
import { TabsContent } from "@/components/ui/TabsContent";
import { Card } from "@/components/ui/Card";
import { CardTitle } from "@/components/ui/CardTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

type StaffUser = {
  id: number;
  email: string;
  role: string;
  active: boolean;
};

type AuditEntry = {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: string;
  before: string | null;
  after: string | null;
  created_at: string;
};

export default function SettingsPage() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState("account");

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto p-[5%] px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
    >
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Settings</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="account" className="gap-2">
            <UserCircle className="size-4" />
            My account
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="size-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <History className="size-4" />
            Activity log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <AccountTab user={user} onSaved={() => void refresh()} />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTab />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function AccountTab({
  user,
  onSaved,
}: {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  onSaved: () => void;
}) {
  const [phoneNumber, setPhoneNumber] = useState(user.phone_number ?? "");
  const [notifyOnClose, setNotifyOnClose] = useState(user.notify_on_close);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setPhoneNumber(user.phone_number ?? "");
    setNotifyOnClose(user.notify_on_close);
  }, [user]);

  async function handleSave() {
    setSaving(true);
    try {
      await api("/api/auth/me", {
        method: "PATCH",
        body: {
          phone_number: phoneNumber.trim() || null,
          notify_on_close: notifyOnClose,
        },
      });
      toast("Settings saved", "success");
      onSaved();
    } catch {
      toast("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card hoverable={false} className="overflow-hidden py-0">
      <div className="border-b border-border px-5 py-4">
        <CardTitle className="text-base">Account settings</CardTitle>
      </div>
      <div className="px-5 py-4 space-y-5">
        <div className="space-y-1.5">
          <Label>Email</Label>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+2348012345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <button
            type="button"
            role="switch"
            aria-checked={notifyOnClose}
            onClick={() => setNotifyOnClose(!notifyOnClose)}
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              notifyOnClose ? "bg-primary" : "bg-input",
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
                notifyOnClose ? "translate-x-4" : "translate-x-0",
              )}
            />
          </button>
          <span className="text-sm font-medium leading-none select-none">
            Text me a summary when I close the day
          </span>
        </label>
        <div className="flex justify-end pt-1">
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await api<StaffUser[]>("/api/users");
      setUsers(data ?? []);
    } catch {
      toast("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setCreating(true);
    try {
      await api("/api/users", {
        method: "POST",
        body: { email: email.trim(), password },
      });
      toast("Staff account created", "success");
      setEmail("");
      setPassword("");
      await loadUsers();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(staff: StaffUser) {
    try {
      await api(`/api/users/${staff.id}`, {
        method: "PATCH",
        body: { active: !staff.active },
      });
      toast(
        staff.active ? "Account deactivated" : "Account activated",
        "success",
      );
      await loadUsers();
    } catch {
      toast("Failed to update user");
    }
  }

  return (
    <Card hoverable={false} className="overflow-hidden py-0">
      <div className="border-b border-border px-5 py-4">
        <CardTitle className="text-base">Staff accounts</CardTitle>
      </div>
      <div className="divide-y divide-border">
        <div className="px-5 py-4">
          <form
            onSubmit={(e) => void handleCreate(e)}
            className="space-y-4"
          >
            <h3 className="text-sm font-semibold">Add staff account</h3>
            <div className="space-y-1.5">
              <Label htmlFor="staff-email">Email</Label>
              <Input
                id="staff-email"
                type="email"
                placeholder="staff@shop.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-password">Password</Label>
              <Input
                id="staff-password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" disabled={creating} size="sm">
              {creating ? "Creating..." : "Create staff account"}
            </Button>
          </form>
        </div>

        {loading ? (
          <div className="flex justify-center px-5 py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <div className="px-5 py-4">
            <p className="text-sm text-muted-foreground">
              No staff accounts yet.
            </p>
          </div>
        ) : (
          users.map((staff) => (
            <div
              key={staff.id}
              className="flex items-center justify-between gap-3 px-5 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{staff.email}</p>
                <p className="text-xs text-muted-foreground">
                  {staff.role}
                  {!staff.active && (
                    <span className="ml-2 text-amber-600 dark:text-amber-400">
                      inactive
                    </span>
                  )}
                </p>
              </div>
              {staff.role === "staff" && (
                <Button
                  variant={staff.active ? "outline" : "default"}
                  size="sm"
                  className="shrink-0"
                  onClick={() => void toggleActive(staff)}
                >
                  {staff.active ? "Deactivate" : "Activate"}
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function ActivityTab() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await api<AuditEntry[]>("/api/audit-log?limit=100");
        if (!cancelled) setEntries(data ?? []);
      } catch {
        if (!cancelled) toast("Failed to load activity log");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatAction = (action: string) => {
    switch (action) {
      case "create":
        return "Created";
      case "update":
        return "Updated";
      case "archive":
        return "Archived";
      case "close":
        return "Closed day";
      case "deactivate":
        return "Deactivated";
      case "activate":
        return "Activated";
      default:
        return action;
    }
  };

  const formatTime = (t: string) => {
    const d = new Date(t);
    return d.toLocaleString("en-NG", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <Card hoverable={false} className="overflow-hidden py-0">
        <div className="border-b border-border px-5 py-4">
          <CardTitle className="text-base">Activity log</CardTitle>
        </div>
        <div className="flex justify-center px-5 py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card hoverable={false} className="overflow-hidden py-0">
      <div className="border-b border-border px-5 py-4">
        <CardTitle className="text-base">Activity log</CardTitle>
      </div>
      <div className="divide-y divide-border">
        {entries.length === 0 ? (
          <div className="px-5 py-4">
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          </div>
        ) : (
          entries.map((e) => (
            <div
              key={e.id}
              className="flex items-start justify-between gap-3 px-5 py-2.5 text-sm"
            >
              <div className="min-w-0 flex-1">
                <span className="font-medium">{formatAction(e.action)}</span>{" "}
                <span className="text-muted-foreground">
                  {e.entity_type}
                </span>{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  {e.entity_id}
                </code>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatTime(e.created_at)}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
