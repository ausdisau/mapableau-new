"use client";

import { useState } from "react";

import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
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
  { name: "Core", description: "Everyday support to live your life: personal care, transport, and consumables." },
  { name: "Capacity Building", description: "Skills and independence: therapy, support coordination, and employment help." },
  { name: "Capital", description: "Equipment, home modifications, and technology." },
  { name: "Transport", description: "Getting to appointments, work, and community activities." },
  { name: "Employment-related supports", description: "Workplace assistance and employment pathways." },
];

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function PlanOpsLiteClient() {
  const [requests, setRequests] = useState<ServiceRequest[]>([
    { id: "request-example", description: "OT with step-free clinic access", status: "requested" },
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

  function addRequest() {
    setRequests((current) => [
      ...current,
      { id: newId("request"), description: "", status: "needed" },
    ]);
  }

  function addInvoice() {
    setInvoices((current) => [
      ...current,
      {
        id: newId("invoice"),
        providerName: "",
        date: "",
        amount: "",
        category: "",
        confirmed: false,
      },
    ]);
  }

  return (
    <div className="space-y-8">
      <p className="text-xs text-muted-foreground" role="note">
        {NDIS_BOUNDARY_NOTICE} PlanOps Lite helps organise information only.
      </p>

      <section aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="font-heading text-lg font-semibold">
          Support categories in plain language
        </h2>
        <ul className="mt-4 space-y-3">
          {SUPPORT_CATEGORY_INFO.map((category) => (
            <li key={category.name}>
              <Card variant="outlined" className="p-4">
                <h3 className="font-medium">{category.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="requests-heading">
        <div className="flex items-center justify-between gap-3">
          <h2 id="requests-heading" className="font-heading text-lg font-semibold">
            Service request tracker
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={addRequest}>
            Add request
          </Button>
        </div>
        <ul className="mt-4 space-y-3">
          {requests.map((request) => (
            <li key={request.id}>
              <Card variant="outlined" className="space-y-3 p-4">
                <AccessibleFormField id={`request-description-${request.id}`} label="Service needed">
                  <input
                    id={`request-description-${request.id}`}
                    value={request.description}
                    onChange={(event) =>
                      setRequests((current) =>
                        current.map((item) =>
                          item.id === request.id
                            ? { ...item, description: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className={formInputClass}
                  />
                </AccessibleFormField>
                <AccessibleFormField id={`request-status-${request.id}`} label="Status">
                  <select
                    id={`request-status-${request.id}`}
                    value={request.status}
                    onChange={(event) =>
                      setRequests((current) =>
                        current.map((item) =>
                          item.id === request.id
                            ? { ...item, status: event.target.value as RequestStatus }
                            : item,
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
                </AccessibleFormField>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="invoices-heading">
        <h2 id="invoices-heading" className="font-heading text-lg font-semibold">
          Invoice checklist
        </h2>
        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addInvoice}>
          Add invoice row
        </Button>

        {invoices.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No invoices added yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <Card variant="outlined" className="grid gap-3 p-4 sm:grid-cols-2">
                  <AccessibleFormField id={`invoice-provider-${invoice.id}`} label="Provider name">
                    <input
                      id={`invoice-provider-${invoice.id}`}
                      value={invoice.providerName}
                      onChange={(event) =>
                        setInvoices((current) =>
                          current.map((item) =>
                            item.id === invoice.id
                              ? { ...item, providerName: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className={formInputClass}
                    />
                  </AccessibleFormField>
                  <AccessibleFormField id={`invoice-date-${invoice.id}`} label="Invoice date">
                    <input
                      id={`invoice-date-${invoice.id}`}
                      type="date"
                      value={invoice.date}
                      onChange={(event) =>
                        setInvoices((current) =>
                          current.map((item) =>
                            item.id === invoice.id ? { ...item, date: event.target.value } : item,
                          ),
                        )
                      }
                      className={formInputClass}
                    />
                  </AccessibleFormField>
                  <AccessibleFormField id={`invoice-amount-${invoice.id}`} label="Invoice amount">
                    <input
                      id={`invoice-amount-${invoice.id}`}
                      inputMode="decimal"
                      value={invoice.amount}
                      onChange={(event) =>
                        setInvoices((current) =>
                          current.map((item) =>
                            item.id === invoice.id ? { ...item, amount: event.target.value } : item,
                          ),
                        )
                      }
                      className={formInputClass}
                    />
                  </AccessibleFormField>
                  <AccessibleFormField id={`invoice-category-${invoice.id}`} label="Support category">
                    <input
                      id={`invoice-category-${invoice.id}`}
                      value={invoice.category}
                      onChange={(event) =>
                        setInvoices((current) =>
                          current.map((item) =>
                            item.id === invoice.id
                              ? { ...item, category: event.target.value }
                              : item,
                          ),
                        )
                      }
                      className={formInputClass}
                    />
                  </AccessibleFormField>
                  <label className="flex items-center gap-2 text-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={invoice.confirmed}
                      onChange={(event) =>
                        setInvoices((current) =>
                          current.map((item) =>
                            item.id === invoice.id
                              ? { ...item, confirmed: event.target.checked }
                              : item,
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
          Plan review preparation
        </h2>
        <div className="mt-4 space-y-4">
          {([
            ["worked", "What worked"],
            ["notWorked", "What did not work"],
            ["unmet", "Unmet needs"],
            ["transport", "Transport barriers"],
            ["gaps", "Provider gaps"],
            ["goals", "Goals for next plan"],
          ] as const).map(([key, label]) => (
            <AccessibleFormField key={key} id={`review-${key}`} label={label}>
              <textarea
                id={`review-${key}`}
                rows={3}
                value={reviewNotes[key]}
                onChange={(event) =>
                  setReviewNotes((current) => ({ ...current, [key]: event.target.value }))
                }
                className={formInputClass}
              />
            </AccessibleFormField>
          ))}
        </div>
      </section>

      <section aria-labelledby="export-heading">
        <h2 id="export-heading" className="font-heading text-lg font-semibold">Export</h2>
        <Button type="button" variant="outline" onClick={() => window.print()} className="mt-2">
          Print summary
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          CSV export and plan-manager integration are not active. Data remains in this browser session.
        </p>
      </section>
    </div>
  );
}
