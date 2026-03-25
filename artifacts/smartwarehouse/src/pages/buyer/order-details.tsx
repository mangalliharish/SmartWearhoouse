import { useParams, Link } from "wouter";
import { useGetOrder, useGetQuotations, useGetSubOrders } from "@workspace/api-client-react";
import { getAuthHeaders } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Stepper } from "@/components/ui/stepper";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Package, MapPin, Calendar, Receipt, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BuyerOrderDetails() {
  const params = useParams();
  const orderId = params.id as string;

  const { data: order, isLoading: isOrderLoading } = useGetOrder(orderId, { request: { headers: getAuthHeaders() } });
  const { data: quotes, isLoading: isQuotesLoading } = useGetQuotations(orderId, { request: { headers: getAuthHeaders() } });
  const { data: subOrders, isLoading: isSubOrdersLoading } = useGetSubOrders(orderId, { request: { headers: getAuthHeaders() } });

  if (isOrderLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  if (!order) return <DashboardLayout><p>Order not found</p></DashboardLayout>;

  const steps = ['requested', 'quoted', 'allocated', 'dispatched', 'delivered'];
  const minPrice = quotes && quotes.length > 0 ? Math.min(...quotes.map(q => q.pricePerUnit)) : null;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href="/buyer" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Orders
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground capitalize">
              {order.material} Order <span className="text-muted-foreground text-lg ml-2 font-mono">#{order.id.slice(0, 8)}</span>
            </h1>
            <p className="text-muted-foreground mt-1">Requested on {format(new Date(order.createdAt), 'MMMM d, yyyy')}</p>
          </div>
          <Badge className="text-base px-4 py-1.5 uppercase tracking-wider" variant="outline">{order.status}</Badge>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/60 p-8 shadow-sm mb-8">
        <Stepper steps={steps} currentStep={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm">
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center"><Info className="w-5 h-5 mr-2 text-primary"/> Requirements</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <Package className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Total Quantity</p>
                  <p className="text-sm text-muted-foreground">{order.totalQty} Units</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Delivery Location</p>
                  <p className="text-sm text-muted-foreground">{order.location}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Calendar className="w-5 h-5 text-muted-foreground mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Required By</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(order.deliveryDate), 'MMM d, yyyy')}</p>
                </div>
              </div>
              {order.notes && (
                <div className="pt-4 border-t border-border mt-4">
                  <p className="text-sm font-medium text-foreground mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground italic bg-muted p-3 rounded-lg">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {/* Allocations view if allocated */}
          {['allocated', 'dispatched', 'delivered'].includes(order.status) && (
            <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm">
              <h3 className="font-display font-semibold text-lg mb-4">Allocated Sub-Orders</h3>
              {isSubOrdersLoading ? <Loader2 className="animate-spin w-5 h-5" /> : (
                <div className="space-y-3">
                  {subOrders?.map(sub => (
                    <div key={sub.id} className="flex justify-between items-center p-4 border border-border/50 rounded-xl bg-muted/20">
                      <div>
                        <p className="font-semibold text-foreground">{sub.dealerName}</p>
                        <p className="text-sm text-muted-foreground">Allocated: <span className="font-medium text-foreground">{sub.allocatedQty} units</span> @ ${sub.pricePerUnit}/unit</p>
                      </div>
                      <Badge variant="secondary">{sub.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quotations view */}
          <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm">
            <h3 className="font-display font-semibold text-lg mb-4 flex items-center"><Receipt className="w-5 h-5 mr-2 text-primary"/> Received Quotations</h3>
            {isQuotesLoading ? <Loader2 className="animate-spin w-5 h-5 text-primary" /> : quotes?.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No quotations received yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground rounded-t-xl text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-xl">Dealer</th>
                      <th className="px-4 py-3">Price / Unit</th>
                      <th className="px-4 py-3">Available Qty</th>
                      <th className="px-4 py-3 rounded-tr-xl">Est. Delivery</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {quotes?.map(quote => {
                      const isLowest = quote.pricePerUnit === minPrice;
                      return (
                        <tr key={quote.id} className={isLowest ? "bg-green-500/5 dark:bg-green-500/10" : ""}>
                          <td className="px-4 py-4 font-medium text-foreground flex items-center">
                            {quote.dealerName}
                            {isLowest && <Badge variant="outline" className="ml-2 bg-green-100 text-green-700 border-green-200 uppercase text-[10px]">Best Price</Badge>}
                          </td>
                          <td className="px-4 py-4 font-mono font-semibold">${quote.pricePerUnit.toFixed(2)}</td>
                          <td className="px-4 py-4">{quote.availableQty} units</td>
                          <td className="px-4 py-4 text-muted-foreground">{format(new Date(quote.deliveryDate), 'MMM d')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
