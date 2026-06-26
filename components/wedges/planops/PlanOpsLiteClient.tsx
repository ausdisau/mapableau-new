"use client";

import { useState } from "react";

import { AccessibleFormField, formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NDIS_BOUNDARY_NOTICE } from "@/types/wedges";

type RequestStatus =
  | "needed"
  | "requested"
  | "provider_contacted"
  | "booked"
  | "started"
  | "problem";

type ServiceRequest = {
  id: string;
  description: string;
  status: RequestStatus;
};

type InvoiceRow = {
  id: string;
  providerName: string;
  date: string;
  amount: string;
  category: string;
  confirmed: boolean;
};

const SUPPORT_CATEGORY_INFO = [
  { name: "Core", description: "Everyday support to live your life — personal care, transport, consumables." },
  { name: "Capacity Building", description: "Skills and independence — therapy, support coordination, employment help." },
  { name: "Capital", description: "Equipment, home modifications, and technology." },
  { name: "Transport", description: "Getting to appointments, work, and community activities." },
  { name: "Employment-related supports", description: "Workplace assistance and employment pathways." },
];

export function PlanOpsLiteClient() {
  const [requests, setRequests] = useState<ServiceRequest[]>([
    { id: "1", description: "OT with step-free clinic access", status: "requested" },
  ]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [reviewNotes, setReviewNotes] = useState({
    worked: "",
    notWorked: "",
    unmet: "",
    transport: "",
    gaps: "",
    goals: "",
  });

  const addRequest = () => {
    setRequests((r) => [
      ...r,
      { id: String(Date.now()), description: "", status: "needed" },
    ]);
  };

  return (
    <div className="space-y-8">
      <p className="text-xs text-muted-foreground" role="note">
        {NDIS_BOUNDARY_NOTICE} PlanOps Lite helps organise information only.
      </p>

      <section aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="font-heading text-lg font-semibold">
          Support categories (plain language)
        </h2>
        <ul className="mt-4 space-y-3">
          {SUPPORT_CATEGORY_INFO.map((cat) => (
            <li key={cat.name}>
              <Card variant="outlined" className="p-4">
                <h3 className="font-medium">{cat.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{cat.description}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="requests-heading">
        <div className="flex items-center justify-between">
          <h2 id="requests-heading" className="font-heading text-lg font-semibold">
            Service request tracker
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={addRequest}>
            Add request
          </Button>
        </div>
        <ul className="mt-4 space-y-3">
          {requests.map((req) => (
            <li key={req.id}>
              <Card variant="outlined" className="p-4">
                <AccessibleFormField id={`req-${req.id}`} label="Service needed">
                  <input
                    id={`req-${req.id}`}
                    type="text"
                    value={req.description}
                    onChange={(e) =>
                      setRequests((list) =>
                        list.map((r) =>
                          r.id === req.id ? { ...r, description: e.target.value } : r,
                        ),
                      )
                    }
                    className={formInputClass}
                  />
                </AccessibleFormField>
                <label className="mt-2 block text-sm font-medium" htmlFor={`status-${req.id}`}>
                  Status
                </label>
                <select
                  id={`status-${req.id}`}
                  value={req.status}
                  onChange={(e) =>
                    setRequests((list) =>
                      list.map((r) =>
                        r.id === req.id
                          ? { ...r, status: e.target.value as RequestStatus }
                          : r,
                      ),
                    )
                  }
                  className={formInputClass}
                >
                  <option value="needed">Needed</option>
                  <option value="requested">Requested</option>
                  <option value="provider_contacted">Provider contacted</option>
                  <option value="booked">Booked</option>
                  <option value="started">Started</option>
                  <option value="problem">Problem to resolve</option>
                </select>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="invoices-heading">
        <h2 id="invoices-heading" className="font-heading text-lg font-semibold">
          Invoice checklist
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() =>
            setInvoices((inv) => [
              ...inv,
              {
                id: String(Date.now()),
                providerName: "",
                date: "",
                amount: "",
                category: "",
                confirmed: false,
              },
            ])
          }
        >
          Add invoice row
        </Button>
        {invoices.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No invoices added yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {invoices.map((inv) => (
              <li key={inv.id}>
                <Card variant="outlined" className="grid gap-2 p-4 sm:grid-cols-2">
                  <input
                    placeholder="Provider name"
                    value={inv.providerName}
                    onChange={(e) =>
                      setInvoices((list) =>
                        list.map((i) =>
                          i.id === inv.id ? { ...i, providerName: e.target.value } : i,
                        ),
                      )
                    }
                    className={formInputClass}
                  />
                  <input
                    type="date"
                    value={inv.date}
                    onChange={(e) =>
                      setInvoices((list) =>
                        list.map((i) =>
                          i.id === inv.id ? { ...i, date: e.target.value } : i,
                        ),
                      )
                    }
                    className={formInputClass}
                  />
                  <input
                    placeholder="Amount"
                    value={inv.amount}
                    onChange={(e) =>
                      setInvoices((list) =>
                        list.map((i) =>
                          i.id === inv.id ? { ...i, amount: e.target.value } : i,
                        ),
                      )
                    }
                    className={formInputClass}
                  />
                  <input
                    placeholder="Support category"
                    value={inv.category}
                    onChange={(e) =>
                      setInvoices((list) =>
                        list.map((i) =>
                          i.id === inv.id ? { ...i, category: e.target.value } : i,
                        ),
                      )
                    }
                    className={formInputClass}
                  />
                  <label className="flex items-center gap-2 text-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={inv.confirmed}
                      onChange={(e) =>
                        setInvoices((list) =>
                          list.map((i) =>
                            i.id === inv.id ? { ...i, confirmed: e.target.checked } : i,
                          ),
                        )
                      }
                    />
                    Service delivered confirmed
                  </label>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="review-heading">
        <h2 id="review-heading" className="font-heading text-lg font-semibold">
          Plan review prep
        </h2>
        <div className="mt-4 space-y-4">
          {(
            [
              ["worked", "What worked"],
              ["notWorked", "What did not work"],
              ["unmet", "Unmet needs"],
              ["transport", "Transport barriers"],
              ["gaps", "Provider gaps"],
              ["goals", "Goals for next plan"],
            ] as const
          ).map(([key, label]) => (
            <AccessibleFormField key={key} id={key} label={label}>
              <textarea
                id={key}
                rows={3}
                value={reviewNotes[key]}
                onChange={(e) =>
                  setReviewNotes((n) => ({ ...n, [key]: e.target.value }))
                }
                className={formInputClass}
              />
            </AccessibleFormField>
          ))}
        </div>
      </section>

      <section aria-labelledby="export-heading">
        <h2 id="export-heading" className="font-heading text-lg font-semibold">
          Export
        </h2>
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={() => window.print()}
          className="mt-2"
        >
          Print summary
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          CSV export and plan-manager integration coming soon. Data stays in your browser
          for now.
        </p>
      </section>
    </div>
  );
}
