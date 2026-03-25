import { useGetDealerSubOrders, useUpdateSubOrderStatus, getGetDealerSubOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Truck, MapPin, CheckCircle, PackageCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function DealerSubOrders() {
  const { data: suborders, isLoading } = useGetDealerSubOrders({ request: { headers: getAuthHeaders() } });
  const updateStatus = useUpdateSubOrderStatus({ request: { headers: getAuthHeaders() } });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleStatusChange = (subOrderId: string, newStatus: "dispatched" | "delivered") => {
    updateStatus.mutate(
      { subOrderId, data: { status: newStatus } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDealerSubOrdersQueryKey() });
          toast({ title: `Status updated to ${newStatus}` });
        },
        onError: () => {
          toast({ title: "Failed to update status", variant: "destructive" });
        }
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">My Allocations</h1>
        <p className="text-muted-foreground mt-1">Manage deliveries for won material contracts</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : suborders?.length === 0 ? (
        <div className="bg-card rounded-2xl border border-dashed border-border/80 p-12 text-center">
          <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No allocations yet</h3>
          <p className="text-muted-foreground">Keep submitting quotations to win material orders.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {suborders?.map(sub => (
            <div key={sub.id} className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground flex-shrink-0">
                  <PackageCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-lg text-foreground capitalize">{sub.material}</h3>
                    <Badge variant="outline" className="uppercase tracking-wider text-[10px]">{sub.status}</Badge>
                  </div>
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground mt-2">
                    <p><strong className="text-foreground">{sub.allocatedQty} Units</strong> at <strong className="text-foreground font-mono">${sub.pricePerUnit}</strong> / unit</p>
                    <p className="flex items-center"><MapPin className="w-4 h-4 mr-1.5" />{sub.location}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                {sub.status === 'allocated' && (
                  <Button 
                    className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => handleStatusChange(sub.id, "dispatched")}
                    disabled={updateStatus.isPending}
                  >
                    <Truck className="w-4 h-4 mr-2" /> Mark Dispatched
                  </Button>
                )}
                {sub.status === 'dispatched' && (
                  <Button 
                    className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => handleStatusChange(sub.id, "delivered")}
                    disabled={updateStatus.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Mark Delivered
                  </Button>
                )}
                {sub.status === 'delivered' && (
                  <div className="px-4 py-2 bg-green-500/10 text-green-600 font-semibold rounded-lg flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" /> Completed
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
