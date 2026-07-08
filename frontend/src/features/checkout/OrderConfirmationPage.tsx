import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { AmberOrb } from "@/components/brand/AmberOrb";
import { Button } from "@/components/ui/Button";
import { useT } from "@/i18n/useT";

export function OrderConfirmationPage() {
  const t = useT();
  const { orderId = "" } = useParams();
  return (
    <div className="relative mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center text-center">
      <AmberOrb className="left-1/2 top-0 -translate-x-1/2" size={300} />
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
        className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success text-white shadow-glow"
      >
        <Check className="h-10 w-10" strokeWidth={3} />
      </motion.div>
      <h1 className="relative font-display text-3xl">{t.confirmation.title}</h1>
      <p className="relative mt-2 text-text-muted">
        {t.confirmation.subtitle}
      </p>
      <div className="relative mt-8 flex gap-3">
        <Button asChild>
          <Link to={`/orders/${orderId}`}>{t.confirmation.track}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/menu">{t.confirmation.orderMore}</Link>
        </Button>
      </div>
    </div>
  );
}
