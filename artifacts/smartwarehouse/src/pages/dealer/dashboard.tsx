import { useState } from "react";
import { useGetOrders, useSubmitQuotation, getGetOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { format } from "date-fns";
import { Package, MapPin, Calculator, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function DealerDashboard() {
  const { data: orders, isLoading } = useGetOrders({ request: { headers: getAuthHeaders() } });
  const submitQuote = useSubmitQuotation({ request: { headers: getAuthHeaders() } });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    pricePerUnit: "",
    availableQty: "",
    deliveryDate: ""
  });

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;

    submitQuote.mutate(
      { 
        data: { 
          orderId: selectedOrderId,
          pricePerUnit: Number(formData.pricePerUnit),
          availableQty: Number(formData.availableQty),
          deliveryDate: formData.deliveryDate
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
          setSelectedOrderId(null);
          setFormData({ pricePerUnit: "", availableQty: "", deliveryDate: "" });
          toast({ title: "Quotation Submitted Successfully" });
        },
        onError: () => {
          toast({ title: "Failed to submit quote", variant: "destructive" });
        }
      }
    );
  };

  // Only show open orders that can be quoted
  const openOrders = orders?.filter(o => o.status === 'requested' || o.status === 'quoted') || [];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Open Material Requests</h1>
        <p className="text-muted-foreground mt-1">Review market needs and submit your quotations</p>
      </div>

      <Dialog open={!!selectedOrderId} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Submit Quotation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuoteSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Price Per Unit ($)</Label>
              <Input 
                type="number" step="0.01" required
                value={formData.pricePerUnit}
                onChange={(e) => setFormData({...formData, pricePerUnit: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Available Quantity to Supply</Label>
              <Input 
                type="number" required
                value={formData.availableQty}
                onChange={(e) => setFormData({...formData, availableQty: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Estimated Delivery Date</Label>
              <Input 
                type="date" required
                value={formData.deliveryDate}
                onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitQuote.isPending}>
              {submitQuote.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Quotation"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : openOrders.length === 0 ? (
        <div className="bg-card rounded-2xl border border-dashed border-border/80 p-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No open requests</h3>
          <p className="text-muted-foreground">Check back later for new material orders from buyers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {openOrders.map((order, idx) => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-primary/10 text-primary p-2.5 rounded-lg inline-flex">
                  <Package className="w-6 h-6" />
                </div>
                <Badge variant="outline">{order.status}</Badge>
              </div>
              
              <h3 className="font-bold text-xl text-foreground capitalize mb-2">{order.material} Order</h3>
              
              <div className="space-y-2 mb-6 flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Required:</span>
                  <span className="font-semibold text-foreground">{order.totalQty} Units</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deadline:</span>
                  <span className="font-semibold text-foreground">{format(new Date(order.deliveryDate), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-start text-sm mt-3 pt-3 border-t border-border/50">
                  <MapPin className="w-4 h-4 text-muted-foreground mr-1.5 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground line-clamp-2">{order.location}</span>
                </div>
              </div>
              
              <Button 
                onClick={() => setSelectedOrderId(order.id)} 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Submit Quote
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
