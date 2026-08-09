import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Users, History, UserCircle, Menu } from "lucide-react";
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
import { api, errorMessage } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { useAppShell } from "@/components/layout/appShell";

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
  const { openMobileNav } = useAppShell();
  const [tab, setTab] = useState("account");

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto p-[5%] px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 rounded-xl lg:hidden"
          onClick={openMobileNav}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="account" className="gap-2">
            <UserCircle className="size-4" />
            My account
          </TabsTrigger>
          {user.role === "owner" && (
            <>
              <TabsTrigger value="users" className="gap-2">
                <Users className="size-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <History className="size-4" />
                Activity log
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="account">
          <AccountTab user={user} onSaved={() => void refresh()} />
        </TabsContent>
        {user.role === "owner" && (
          <>
            <TabsContent value="users">
              <UsersTab />
            </TabsContent>
            <TabsContent value="activity">
              <ActivityTab />
            </TabsContent>
          </>
        )}
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
  const [email2Name, setEmail2Name] = useState(user.email_2_name ?? "");
  const [email2Address, setEmail2Address] = useState(user.email_2_address ?? "");
  const [email3Name, setEmail3Name] = useState(user.email_3_name ?? "");
  const [email3Address, setEmail3Address] = useState(user.email_3_address ?? "");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const [prevUser, setPrevUser] = useState(user);

  if (prevUser !== user) {
    setPrevUser(user);
    setEmail2Name(user.email_2_name ?? "");
    setEmail2Address(user.email_2_address ?? "");
    setEmail3Name(user.email_3_name ?? "");
    setEmail3Address(user.email_3_address ?? "");
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api("/api/auth/me", {
        method: "PATCH",
        body: {
          email_2_name: email2Name.trim() || null,
          email_2_address: email2Address.trim() || null,
          email_3_name: email3Name.trim() || null,
          email_3_address: email3Address.trim() || null,
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
          <Label>Primary Account Email (You)</Label>
          <p className="text-sm font-semibold text-foreground">{user.email}</p>
        </div>

        <div className="border-t border-border pt-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Day Summary Email Recipients</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Add up to 2 additional email addresses (maximum of 3 total recipients, including yourself) to receive manual sales summary reports.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email2Name">Recipient 2 Name</Label>
              <Input
                id="email2Name"
                placeholder="e.g. Manager John"
                value={email2Name}
                onChange={(e) => setEmail2Name(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email2Address">Recipient 2 Email</Label>
              <Input
                id="email2Address"
                type="email"
                placeholder="e.g. manager@example.com"
                value={email2Address}
                onChange={(e) => setEmail2Address(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email3Name">Recipient 3 Name</Label>
              <Input
                id="email3Name"
                placeholder="e.g. Auditor Jane"
                value={email3Name}
                onChange={(e) => setEmail3Name(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email3Address">Recipient 3 Email</Label>
              <Input
                id="email3Address"
                type="email"
                placeholder="e.g. auditor@example.com"
                value={email3Address}
                onChange={(e) => setEmail3Address(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving..." : "Save settings"}
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
    let cancelled = false;
    void (async () => {
      try {
        const data = await api<StaffUser[]>("/api/users");
        if (!cancelled) setUsers(data ?? []);
      } catch {
        if (!cancelled) toast("Failed to load users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
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
      toast(errorMessage(err, "Failed to create user"));
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
