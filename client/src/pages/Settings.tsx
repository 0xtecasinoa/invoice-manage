import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockClientFormats } from "@/data/mockData";
import { type ClientFormat } from "@/types/construction";
import { Plus, Pencil, Building2, FileText, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const Settings = () => {
  const [companyInfo, setCompanyInfo] = useState({
    name: "株式会社 KATATI",
    representative: "代表取締役 松木昭利",
    registrationNumber: "T7040001125249",
    address: "〒283-0801 千葉県東金市八坂台3-2-4",
    tel: "TEL 050(5480)5378",
    fax: "FAX 012(345)6789",
  });

  const [formats, setFormats] = useState<ClientFormat[]>(mockClientFormats);
  const [editingFormat, setEditingFormat] = useState<ClientFormat | null>(null);
  const [showAddFormat, setShowAddFormat] = useState(false);
  const [newFormat, setNewFormat] = useState({ clientName: "", clientCode: "", formatName: "", fields: "" });

  const handleSaveCompany = () => toast.success("会社情報を保存しました");

  const handleAddFormat = () => {
    const format: ClientFormat = {
      id: `cf-${Date.now()}`,
      clientName: newFormat.clientName,
      clientCode: newFormat.clientCode,
      formatName: newFormat.formatName,
      fields: newFormat.fields.split(",").map((f) => f.trim()),
    };
    setFormats([...formats, format]);
    setShowAddFormat(false);
    setNewFormat({ clientName: "", clientCode: "", formatName: "", fields: "" });
    toast.success("書式を追加しました");
  };

  const handleDeleteFormat = (id: string) => {
    setFormats(formats.filter((f) => f.id !== id));
    toast.success("書式を削除しました");
  };

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">設定</h1>
          <p className="text-sm text-muted-foreground mt-1">会社情報・請求書書式の管理</p>
        </div>

        <Tabs defaultValue="company" className="space-y-6">
          <TabsList>
            <TabsTrigger value="company" className="gap-2"><Building2 className="w-4 h-4" />会社情報</TabsTrigger>
            <TabsTrigger value="formats" className="gap-2"><FileText className="w-4 h-4" />請求書書式</TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <div className="bg-card rounded-xl border border-border p-6 max-w-2xl">
              <h2 className="text-lg font-semibold text-card-foreground mb-4">自社情報</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>会社名</Label>
                    <Input value={companyInfo.name} onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })} />
                  </div>
                  <div>
                    <Label>代表者名</Label>
                    <Input value={companyInfo.representative} onChange={(e) => setCompanyInfo({ ...companyInfo, representative: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>登録番号</Label>
                  <Input value={companyInfo.registrationNumber} onChange={(e) => setCompanyInfo({ ...companyInfo, registrationNumber: e.target.value })} />
                </div>
                <div>
                  <Label>住所</Label>
                  <Input value={companyInfo.address} onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>電話番号</Label>
                    <Input value={companyInfo.tel} onChange={(e) => setCompanyInfo({ ...companyInfo, tel: e.target.value })} />
                  </div>
                  <div>
                    <Label>FAX番号</Label>
                    <Input value={companyInfo.fax} onChange={(e) => setCompanyInfo({ ...companyInfo, fax: e.target.value })} />
                  </div>
                </div>
                <Button onClick={handleSaveCompany} className="bg-accent text-accent-foreground hover:bg-accent/90">保存</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="formats">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">元請別 請求書書式</h2>
                <Button onClick={() => setShowAddFormat(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Plus className="w-4 h-4 mr-2" />
                  書式追加
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">元請ごとに複数の書式を登録できます。請求書作成時に選択して出力します。</p>
              <div className="space-y-6">
                {(() => {
                  const byClient = formats.reduce<Record<string, ClientFormat[]>>((acc, f) => {
                    const key = `${f.clientCode}:${f.clientName}`;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(f);
                    return acc;
                  }, {});
                  return Object.entries(byClient).map(([key, clientFormats]) => (
                    <div key={key} className="bg-card rounded-xl border border-border overflow-hidden">
                      <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
                        <h3 className="text-base font-semibold text-card-foreground">{clientFormats[0].clientName}</h3>
                        <span className="text-xs font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded">{clientFormats[0].clientCode}</span>
                        <span className="text-xs text-muted-foreground">（{clientFormats.length} 書式）</span>
                      </div>
                      <div className="divide-y divide-border">
                        {clientFormats.map((format) => (
                          <div key={format.id} className="p-5 flex items-start justify-between">
                            <div>
                              <p className="text-sm text-accent font-medium mb-2">{format.formatName}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {format.fields.map((field) => (
                                  <span key={field} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md">{field}</span>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteFormat(format.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <Dialog open={showAddFormat} onOpenChange={setShowAddFormat}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>請求書書式追加</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>元請会社名</Label>
                    <Input value={newFormat.clientName} onChange={(e) => setNewFormat({ ...newFormat, clientName: e.target.value })} />
                  </div>
                  <div>
                    <Label>取引先コード</Label>
                    <Input value={newFormat.clientCode} onChange={(e) => setNewFormat({ ...newFormat, clientCode: e.target.value })} />
                  </div>
                  <div>
                    <Label>書式名</Label>
                    <Input value={newFormat.formatName} onChange={(e) => setNewFormat({ ...newFormat, formatName: e.target.value })} placeholder="例: 請求書(合計表)" />
                  </div>
                  <div>
                    <Label>フィールド（カンマ区切り）</Label>
                    <Input value={newFormat.fields} onChange={(e) => setNewFormat({ ...newFormat, fields: e.target.value })} placeholder="日付, 工事名, 数量, 単位, 単価, 金額" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddFormat(false)}>キャンセル</Button>
                  <Button onClick={handleAddFormat} className="bg-accent text-accent-foreground hover:bg-accent/90">追加</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;
