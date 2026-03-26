import { useParams, Link } from "wouter";
import { useGetOrder, useGetQuotations, useGetSubOrders, useAutoAllocate, getGetOrderQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Stepper } from "@/components/ui/stepper";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Play, Package, MapPin, Receipt, Info, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function AdminOrderDetails() {
  const params = useParams();
  const orderId = params.id as string;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: order, isLoading: isOrderLoading } = useGetOrder(orderId, { request: { headers: getAuthHeaders() } });
  const { data: quotes, isLoading: isQuotesLoading } = useGetQuotations(orderId, { request: { headers: getAuthHeaders() } });
  const { data: subOrders, isLoading: isSubOrdersLoading } = useGetSubOrders(orderId, { request: { headers: getAuthHeaders() } });
  const allocateOrder = useAutoAllocate({ request: { headers: getAuthHeaders() } });

  if (isOrderLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  if (!order) return <DashboardLayout><p>Order not found</p></DashboardLayout>;

  const handleAllocate = () => {
    allocateOrder.mutate(
      { orderId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
          toast({ title: "Order successfully auto-allocated." });
        },
        onError: (err: any) => {
          toast({ title: "Allocation Failed", description: err.data?.error || "Error", variant: "destructive" });
        }
      }
    );
  };

  const steps = ['requested', 'quoted', 'allocated', 'dispatched', 'delivered'];
  const minPrice = quotes && quotes.length > 0 ? Math.min(...quotes.map(q => parseFloat(String(q.pricePerUnit)))) : null;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground capitalize">
              {order.material} Order <span className="text-muted-foreground text-lg ml-2 font-mono">#{order.id.slice(0, 8)}</span>
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center">
              <Building2 className="w-4 h-4 mr-2" />
              Buyer: <span className="font-semibold text-foreground ml-1">{order.buyerName}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="text-base px-4 py-1.5 uppercase tracking-wider" variant="outline">{order.status}</Badge>
            {order.status === 'quoted' && (
              <Button onClick={handleAllocate} disabled={allocateOrder.isPending} className="bg-accent hover:bg-accent/90">
                {allocateOrder.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                Run Allocation Algorithm
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/60 p-8 shadow-sm mb-8">
        <Stepper steps={steps} currentStep={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm">
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center"><Info className="w-5 h-5 mr-2 text-primary"/> Order Details</h3>
            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <p className="text-sm font-medium text-foreground">Total Quantity</p>
                <p className="text-sm text-muted-foreground">{order.totalQty} Units</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Required Date</p>
                <p className="text-sm text-muted-foreground">{format(new Date(order.deliveryDate), 'MMM d, yyyy')}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-foreground">Delivery Location</p>
                <p className="text-sm text-muted-foreground">{order.location}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm">
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center"><Receipt className="w-5 h-5 mr-2 text-primary"/> Submitted Quotations</h3>
            {isQuotesLoading ? <Loader2 className="animate-spin w-5 h-5 text-primary" /> : quotes?.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No quotes yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-3 py-2 rounded-tl-lg">Dealer</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2 rounded-tr-lg">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {quotes?.map(quote => (
                      <tr key={quote.id} className={parseFloat(String(quote.pricePerUnit)) === minPrice ? "bg-green-500/5 dark:bg-green-500/10" : ""}>
                        <td className="px-3 py-3 font-medium">{quote.dealerName}</td>
                        <td className="px-3 py-3 font-mono font-semibold">${quote.pricePerUnit}</td>
                        <td className="px-3 py-3 text-muted-foreground">{quote.availableQty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm h-full min-h-[400px]">
            <h3 className="font-display font-semibold text-lg mb-4">Allocated Sub-Orders (Results)</h3>
            {isSubOrdersLoading ? <Loader2 className="animate-spin w-5 h-5" /> : subOrders?.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center pb-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">Order has not been allocated yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subOrders?.map(sub => (
                  <div key={sub.id} className="flex justify-between items-center p-4 border border-border/50 rounded-xl bg-muted/20">
                    <div>
                      <p className="font-semibold text-foreground flex items-center">
                        <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
                        {sub.dealerName}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 ml-6">
                        Allocated: <span className="font-medium text-foreground">{sub.allocatedQty} units</span> @ ${sub.pricePerUnit}/u
                      </p>
                    </div>
                    <Badge variant="secondary">{sub.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
