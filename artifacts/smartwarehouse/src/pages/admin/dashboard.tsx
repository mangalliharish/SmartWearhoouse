import { Link } from "wouter";
import { useGetOrders, useAutoAllocate, getGetOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { format } from "date-fns";
import { Package, MapPin, Play, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const { data: orders, isLoading } = useGetOrders({ request: { headers: getAuthHeaders() } });
  const allocateOrder = useAutoAllocate({ request: { headers: getAuthHeaders() } });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAllocate = (e: React.MouseEvent, orderId: string) => {
    e.preventDefault(); // prevent triggering Link
    allocateOrder.mutate(
      { orderId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
          toast({ title: "Order successfully auto-allocated to dealers." });
        },
        onError: (err: any) => {
          toast({ title: "Allocation Failed", description: err.response?.data?.error || "Error", variant: "destructive" });
        }
      }
    );
  };

  const statusColors: Record<string, string> = {
    requested: "bg-gray-100 text-gray-700",
    quoted: "bg-blue-100 text-blue-700",
    allocated: "bg-purple-100 text-purple-700",
    dispatched: "bg-orange-100 text-orange-700",
    delivered: "bg-green-100 text-green-700"
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Admin Control Center</h1>
        <p className="text-muted-foreground mt-1">Manage platform orders and trigger auto-allocations</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : orders?.length === 0 ? (
        <div className="bg-card rounded-2xl border border-dashed border-border/80 p-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No orders in system</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {orders?.map((order, idx) => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link href={`/admin/orders/${order.id}`}>
                <div className="bg-card border border-border/60 rounded-2xl p-6 transition-all cursor-pointer shadow-sm hover:shadow-md group flex flex-col md:flex-row md:items-center justify-between gap-6">
                  
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
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <p>Buyer: <span className="font-medium text-foreground">{order.buyerName}</span></p>
                        <p className="flex items-center"><MapPin className="w-4 h-4 mr-1.5" />{order.totalQty} Units to {order.location}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                    {order.status === 'quoted' && (
                      <Button 
                        onClick={(e) => handleAllocate(e, order.id)}
                        className="bg-accent hover:bg-accent/90 text-white font-semibold"
                        disabled={allocateOrder.isPending}
                      >
                        {allocateOrder.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                        Auto Allocate
                      </Button>
                    )}
                    <div className="text-primary opacity-50 group-hover:opacity-100 transition-opacity hidden md:flex items-center">
                      <span className="text-sm font-medium mr-1">Manage</span>
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
