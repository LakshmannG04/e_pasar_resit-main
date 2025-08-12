import { useState } from "react";
import User_Layout from "../layouts";
import Cookies from "js-cookie";
import { useRouter } from "next/router";

export default function Checkout() {
    const [First_Name, setFirst_Name] = useState("");
    const [Address, setAddress] = useState("");
    const [postal_Code, setPostal_Code] = useState("");
    const [Contact_Number, setContact_Number] = useState("");
    const [errors, setErrors] = useState<any>({});

    const router = useRouter();

    const validateForm = () => {
        const newErrors: any = {};

        if (!First_Name.trim()) newErrors.First_Name = "Full Name is required.";
        if (!Address.trim()) newErrors.Address = "Address is required.";
        if (!postal_Code.trim() || !/^\d{5,6}$/.test(postal_Code))
            newErrors.postal_Code = "Postal Code must be 5-6 digits.";
        if (!Contact_Number.trim() || !/^\d{10,15}$/.test(Contact_Number))
            newErrors.Contact_Number = "Contact Number must be 10-15 digits.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const Continue = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!validateForm()) return;

        const delivery = {
            FirstName: First_Name,
            Address : Address,
            PostalCode: postal_Code,
            ContactNo: Contact_Number,
        };

        Cookies.set("delivery", JSON.stringify(delivery), { expires: 0.25 / 24 });
        router.push("./summaryPage");
    };

    return (
        <User_Layout>
            <div className="bg-gray-50 dark:bg-gray-900 flex min-h-screen">
                
            <div className="container d-flex justify-content-center align-items-center py-5 min-vh-100">
                <div className="card shadow-lg border-0 w-100" style={{ maxWidth: "550px" }}>
                    <div className="card-body p-4 p-md-5">
                        <h2 className="mb-4 text-center fw-bold text-primary">Shipping Details</h2>
                        <form onSubmit={Continue} noValidate>
                            <div className="mb-3">
                                <label className="form-label">Full Name</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.First_Name ? "is-invalid" : ""}`}
                                    value={First_Name}
                                    onChange={(e) => setFirst_Name(e.target.value)}
                                    placeholder="John Doe"
                                />
                                {errors.First_Name && (
                                    <div className="text-danger mt-1">{errors.First_Name}</div>
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Address</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.Address ? "is-invalid" : ""}`}
                                    value={Address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="123 Main St, City"
                                />
                                {errors.Address && (
                                    <div className="text-danger mt-1">{errors.Address}</div>
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Postal Code</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.postal_Code ? "is-invalid" : ""}`}
                                    value={postal_Code}
                                    onChange={(e) => setPostal_Code(e.target.value)}
                                    placeholder="123456"
                                />
                                {errors.postal_Code && (
                                    <div className="text-danger mt-1">{errors.postal_Code}</div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="form-label">Contact Number</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.Contact_Number ? "is-invalid" : ""}`}
                                    value={Contact_Number}
                                    onChange={(e) => setContact_Number(e.target.value)}
                                    placeholder="0123456789"
                                />
                                {errors.Contact_Number && (
                                    <div className="text-danger mt-1">{errors.Contact_Number}</div>
                                )}
                            </div>

                            <div className="d-grid">
                                <button type="submit" className="btn btn-primary btn-lg">
                                    Continue
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            </div>
        </User_Layout>
    );
}
