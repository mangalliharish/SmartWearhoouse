import { useState } from "react";
import { Link } from "wouter";
import { useGetOrders, useCreateOrder, getGetOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { format } from "date-fns";
import { 
  Plus, Package, MapPin, Calendar, Clock, ChevronRight, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function BuyerDashboard() {
  const { data: orders, isLoading } = useGetOrders({ request: { headers: getAuthHeaders() } });
  const createOrder = useCreateOrder({ request: { headers: getAuthHeaders() } });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    material: "cement" as "cement"|"steel"|"sand",
    totalQty: "",
    location: "",
    deliveryDate: "",
    notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createOrder.mutate(
      { 
        data: { 
          ...formData, 
          totalQty: Number(formData.totalQty) 
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
          setOpen(false);
          toast({ title: "Order Created Successfully" });
        },
        onError: () => {
          toast({ title: "Failed to create order", variant: "destructive" });
        }
      }
    );
  };

  const statusColors: Record<string, string> = {
    requested: "bg-gray-100 text-gray-700 border-gray-200",
    quoted: "bg-blue-100 text-blue-700 border-blue-200",
    allocated: "bg-purple-100 text-purple-700 border-purple-200",
    dispatched: "bg-orange-100 text-orange-700 border-orange-200",
    delivered: "bg-green-100 text-green-700 border-green-200"
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">My Orders</h1>
          <p className="text-muted-foreground mt-1">Track and manage your material requests</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-semibold">
              <Plus className="w-5 h-5 mr-2" />
              Create New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">New Material Order</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Material Type</Label>
                <Select value={formData.material} onValueChange={(v: any) => setFormData({...formData, material: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cement">Cement</SelectItem>
                    <SelectItem value="steel">Steel</SelectItem>
                    <SelectItem value="sand">Sand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity (Units)</Label>
                  <Input 
                    type="number" 
                    required min="1" 
                    value={formData.totalQty}
                    onChange={(e) => setFormData({...formData, totalQty: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Required Date</Label>
                  <Input 
                    type="date" 
                    required 
                    value={formData.deliveryDate}
                    onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Delivery Site / Location</Label>
                <Input 
                  required 
                  placeholder="123 Construction Site St."
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Textarea 
                  placeholder="Special instructions..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>
              <Button type="submit" className="w-full" disabled={createOrder.isPending}>
                {createOrder.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Request"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : orders?.length === 0 ? (
        <div className="bg-card rounded-2xl border border-dashed border-border/80 p-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No orders yet</h3>
          <p className="text-muted-foreground">Create your first material request to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orders?.map((order, idx) => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link href={`/buyer/orders/${order.id}`}>
                <div className="bg-card hover:bg-muted/30 border border-border/60 rounded-2xl p-6 transition-all cursor-pointer shadow-sm hover:shadow-md group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <Package className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-lg text-foreground capitalize">{order.material} Order</h3>
                          <Badge variant="outline" className={statusColors[order.status] || ""}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                          <span className="flex items-center"><Package className="w-4 h-4 mr-1.5" />{order.totalQty} Units</span>
                          <span className="flex items-center"><MapPin className="w-4 h-4 mr-1.5" />{order.location}</span>
                          <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5" />Needed by {format(new Date(order.deliveryDate), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm font-medium mr-2">View Details</span>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
