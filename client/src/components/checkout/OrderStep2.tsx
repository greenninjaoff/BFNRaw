"use client";

import AddressBlock from "./AddressBlock";
import CourierInstructionsRow from "./CourierInstructionsRow";
import PhoneRow from "./PhoneRow";
import LeaveAtDoorToggle from "./LeaveAtDoorToggle";
import PromoRow from "./PromoRow";
import PaymentSection from "./PaymentSection";
import PriceDetails from "./PriceDetails";
import StickyOrderBar from "./StickyOrderBar";
import CourierInstructionsSheet from "./sheets/CourierInstructionsSheet";
import AddressSheet from "./sheets/AddressSheet";
import PhoneSheet from "./sheets/PhoneSheet";
import PromoSheet from "./sheets/PromoSheet";
import CardSheet from "./sheets/CardSheet";

const OrderStep2 = () => (
  <div className="flex flex-col gap-0 pb-28 bg-[rgb(var(--bg))]">
    <AddressBlock />
    <div className="h-px bg-[rgb(var(--border))] mx-4" />
    <CourierInstructionsRow />
    <div className="h-px bg-[rgb(var(--border))] mx-4" />
    <PhoneRow />
    <div className="h-px bg-[rgb(var(--border))] mx-4" />
    <LeaveAtDoorToggle />

    <div className="h-3 bg-[rgb(var(--surface))]" />
    <PromoRow />
    <div className="h-3 bg-[rgb(var(--surface))]" />
    <PaymentSection />
    <div className="h-3 bg-[rgb(var(--surface))]" />
    <PriceDetails />

    <StickyOrderBar />

    <AddressSheet />
    <CourierInstructionsSheet />
    <PhoneSheet />
    <PromoSheet />
    <CardSheet />
  </div>
);

export default OrderStep2;
