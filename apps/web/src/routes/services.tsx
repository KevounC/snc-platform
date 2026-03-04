import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import type React from "react";
import type { Service } from "@snc/shared";

import { fetchAuthState } from "../lib/auth.js";
import { fetchServices } from "../lib/booking.js";
import { ServiceCard } from "../components/booking/service-card.js";
import { BookingForm } from "../components/booking/booking-form.js";
import listingStyles from "../styles/listing-page.module.css";
import styles from "./services.module.css";

export const Route = createFileRoute("/services")({
  component: ServicesPage,
});

function ServicesPage(): React.ReactElement {
  const navigate = useNavigate();

  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFormServiceId, setActiveFormServiceId] = useState<string | null>(null);
  const [successServiceId, setSuccessServiceId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await fetchServices();
        if (!cancelled) {
          setServices(data);
        }
      } catch {
        if (!cancelled) {
          setError("Failed to load services");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRequestBooking = useCallback(
    async (serviceId: string) => {
      const { user } = await fetchAuthState();
      if (user === null) {
        void navigate({ to: "/login" });
        return;
      }
      setSuccessServiceId(null);
      setActiveFormServiceId(serviceId);
    },
    [navigate],
  );

  const handleBookingSuccess = useCallback(() => {
    setSuccessServiceId(activeFormServiceId);
    setActiveFormServiceId(null);
  }, [activeFormServiceId]);

  const handleBookingCancel = useCallback(() => {
    setActiveFormServiceId(null);
  }, []);

  return (
    <div className={styles.servicesPage}>
      <h1 className={listingStyles.heading}>Studio &amp; Label Services</h1>
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}
      {isLoading ? (
        <p className={listingStyles.status}>Loading...</p>
      ) : services.length === 0 ? (
        <p className={listingStyles.status}>No services are currently available.</p>
      ) : (
        <div className={styles.serviceList}>
          {services.map((service) => (
            <div key={service.id} className={styles.serviceItem}>
              <ServiceCard
                service={service}
                onRequestBooking={handleRequestBooking}
              />
              {activeFormServiceId === service.id && (
                <div className={styles.formWrapper}>
                  <BookingForm
                    serviceId={service.id}
                    serviceName={service.name}
                    onSubmit={handleBookingSuccess}
                    onCancel={handleBookingCancel}
                  />
                </div>
              )}
              {successServiceId === service.id && (
                <div className={styles.successMessage} role="status">
                  Your booking request has been submitted. A cooperative member
                  will review it shortly.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
