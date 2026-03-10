"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

export default function CheckoutPage() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [order, setOrder] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);

  const [addressName, setAddressName] = useState("");
  const [addressPhone, setAddressPhone] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressArea, setAddressArea] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchOrder() {
      const { data: o, error: orderErr } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (*),
          shops ( name, logo_url, instapay_name, instapay_number )
        `,
        )
        .eq("checkout_token", token)
        .single();

      if (orderErr || !o) {
        setError("Checkout link is invalid or has expired.");
      } else {
        setOrder(o);
        setShop(o.shops);
      }
      setLoading(false);
    }
    fetchOrder();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    let proofUrl = null;

    if (paymentMethod === "instapay") {
      if (!proofFile) {
        setError("Please upload your InstaPay screenshot.");
        setSubmitting(false);
        return;
      }

      const ext = proofFile.name.split(".").pop();
      const filePath = `${order.shop_id}/${order.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(filePath, proofFile);
      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`);
        setSubmitting(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("payment-proofs").getPublicUrl(filePath);
      proofUrl = publicUrl;
    }

    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        address_name: addressName,
        address_phone: addressPhone,
        address_city: addressCity,
        address_area: addressArea,
        address_street: addressStreet,
        notes,
        payment_method: paymentMethod,
        payment_proof_url: proofUrl,
        status: "pending",
      })
      .eq("id", order.id);

    if (updateErr) {
      setError(updateErr.message);
      setSubmitting(false);
    } else {
      setOrder({
        ...order,
        status: "pending",
        payment_method: paymentMethod,
        payment_proof_url: proofUrl,
      });
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500 animate-pulse">
          Loading your order securely...
        </div>
      </div>
    );
  if (error && !order)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 font-semibold text-center p-4">
          {error}
        </div>
      </div>
    );

  if (
    order?.status !== "draft" &&
    order?.status !== "pending" &&
    order?.status !== "confirmed"
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold">
        This checkout link is no longer active.
      </div>
    );
  }

  if (order?.payment_method) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-2">
          <CardContent className="pt-8 pb-6 space-y-4">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-3xl">
              ✓
            </div>
            <h1 className="text-2xl font-bold">Order Submitted!</h1>
            <p className="text-slate-500">
              Your order <strong>#{order.order_number}</strong> has been
              received by <strong>{shop?.name}</strong> and is being prepared.
            </p>
            <div className="bg-slate-50 border p-4 rounded-lg text-sm font-mono text-left">
              Total: {order.total} EGP (
              {order.payment_method === "cod" ? "Cash on Delivery" : "InstaPay"}
              )
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Order Summary */}
        <div className="space-y-6">
          <div className="text-center md:text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {shop?.logo_url && (
              <img
                src={shop.logo_url}
                alt={shop.name}
                className="w-20 h-20 rounded-full mx-auto md:mx-0 mb-3 object-cover border"
              />
            )}
            <h1 className="text-2xl font-bold">{shop?.name}</h1>
            <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
              Secure Checkout
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.order_items.map((item: any) => (
                <div key={item.id} className="flex gap-4 items-center">
                  {item.variant_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.variant_image_url}
                      alt={item.product_name}
                      className="w-20 h-20 rounded-lg object-cover border flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-sm flex-shrink-0">
                      No img
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-base truncate">
                      {item.product_name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {item.variant_name} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-semibold text-base whitespace-nowrap">
                    {item.line_total} EGP
                  </span>
                </div>
              ))}

              <Separator />

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{order.subtotal} EGP</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping</span>
                  <span>{order.shipping_fee} EGP</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t mt-2">
                  <span>Total</span>
                  <span>{order.total} EGP</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shipping Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Full Name</Label>
                    <Input
                      required
                      value={addressName}
                      onChange={(e) => setAddressName(e.target.value)}
                      placeholder="Ali Ahmed"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone Number</Label>
                    <Input
                      required
                      value={addressPhone}
                      onChange={(e) => setAddressPhone(e.target.value)}
                      placeholder="+201..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>City / Governorate</Label>
                    <Input
                      required
                      value={addressCity}
                      onChange={(e) => setAddressCity(e.target.value)}
                      placeholder="Cairo"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Area</Label>
                    <Input
                      required
                      value={addressArea}
                      onChange={(e) => setAddressArea(e.target.value)}
                      placeholder="Nasr City"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Street Address &amp; Building</Label>
                  <Input
                    required
                    value={addressStreet}
                    onChange={(e) => setAddressStreet(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Delivery instructions..."
                    className="h-16"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`block border-2 p-4 rounded-xl cursor-pointer transition-all ${paymentMethod === "cod" ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="sr-only"
                    />
                    <div className="font-bold text-sm">💵 Cash on Delivery</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Pay when it arrives.
                    </div>
                  </label>
                  <label
                    className={`block border-2 p-4 rounded-xl cursor-pointer transition-all ${paymentMethod === "instapay" ? "border-purple-600 bg-purple-50" : "border-slate-200 hover:bg-purple-50"}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="instapay"
                      checked={paymentMethod === "instapay"}
                      onChange={() => setPaymentMethod("instapay")}
                      className="sr-only"
                    />
                    <div className="font-bold text-sm text-purple-700">
                      📱 InstaPay
                    </div>
                    <div className="text-xs text-purple-600/80 mt-1">
                      Transfer &amp; upload receipt.
                    </div>
                  </label>
                </div>

                {paymentMethod === "instapay" && (
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl space-y-3">
                    <p className="font-semibold text-purple-900 text-sm">
                      Transfer <strong>{order.total} EGP</strong> to:
                    </p>
                    <div className="bg-white p-3 rounded-lg font-mono text-sm border border-purple-100">
                      <p className="font-bold text-slate-900">
                        {shop?.instapay_number || "N/A"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Name: {shop?.instapay_name}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-purple-900">
                        Upload Receipt Screenshot
                      </Label>
                      <Input
                        type="file"
                        accept="image/*"
                        required
                        onChange={(e) =>
                          setProofFile(e.target.files?.[0] || null)
                        }
                        className="text-xs"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 text-base font-bold"
            >
              {submitting
                ? "Processing securely..."
                : `Complete Order · ${order.total} EGP`}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
