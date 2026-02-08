import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, beforeEach, afterEach, expect } from "vitest";
import EditPatientModal from "../../app/patients/[id]/EditPatientModal";

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

const patient = {
  id: "pat-001",
  firstName: "Nora",
  lastName: "Kim",
  dob: "1990-01-01",
  mrn: "MRN-1001",
  status: "active",
  riskLevel: "medium",
  primaryProviderId: "prov-001",
  createdAt: "2026-02-01T10:00:00Z",
};

const providers = [
  { id: "prov-001", name: "Dr. Maya Chen" },
  { id: "prov-002", name: "Dr. Lucas Ramirez" },
];

function renderModal() {
  render(<EditPatientModal patient={patient} providers={providers} />);
}

describe("EditPatientModal (component)", () => {
  beforeEach(() => {
    refreshMock.mockClear();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("renders initial patient data", async () => {
    renderModal();
    await userEvent.click(screen.getAllByTestId("edit-patient-open")[0]);

    expect(screen.getByTestId("edit-patient-first-name")).toHaveValue(
      patient.firstName
    );
    expect(screen.getByTestId("edit-patient-last-name")).toHaveValue(
      patient.lastName
    );
    expect(screen.getByTestId("edit-patient-dob")).toHaveValue(patient.dob);
    expect(screen.getByTestId("edit-patient-status")).toHaveValue(
      patient.status
    );
    expect(screen.getByTestId("edit-patient-risk")).toHaveValue(
      patient.riskLevel
    );
    expect(screen.getByTestId("edit-patient-provider")).toHaveValue(
      patient.primaryProviderId
    );
  });

  it("shows validation error when required fields are cleared", async () => {
    renderModal();
    await userEvent.click(screen.getAllByTestId("edit-patient-open")[0]);

    const firstName = screen.getByTestId("edit-patient-first-name");
    await userEvent.clear(firstName);
    await userEvent.click(screen.getByTestId("edit-patient-save"));

    expect(
      await screen.findByText("First name is required.")
    ).toBeInTheDocument();
  });

  it("disables save while submitting", async () => {
    renderModal();
    await userEvent.click(screen.getAllByTestId("edit-patient-open")[0]);

    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );

    const saveButton = screen.getByTestId("edit-patient-save");
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(saveButton).toBeDisabled();
      expect(saveButton).toHaveTextContent("Saving...");
    });
  });

  it("submits successfully and closes the modal", async () => {
    renderModal();
    await userEvent.click(screen.getAllByTestId("edit-patient-open")[0]);

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await userEvent.click(screen.getByTestId("edit-patient-save"));

    await waitFor(() => {
      expect(screen.queryByTestId("edit-patient-modal")).not.toBeInTheDocument();
    });

    expect(refreshMock).toHaveBeenCalledTimes(1);
  });
});
