import { useState } from "react";
import { Input } from "./ui/Input";
import { LocationInput } from "./LocationInput";
import { Button } from "./ui/Button";
import { Label } from "./ui/Label";
import { MapPin, Type, AlignLeft, Mail } from "lucide-react";

function FormField({ id, Icon, label, optional = false, ...inputProps }) {
    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-muted-foreground" /> {label}
                {optional && (
                    <>
                        {" "}
                        <span className="text-muted-foreground font-normal">(Optional)</span>
                    </>
                )}
            </Label>
            <Input id={id} name={id} {...inputProps} />
        </div>
    );
}

export const EventForm = ({ onSubmit, initialData = {}, isEditing = false }) => {
    const [formData, setFormData] = useState({
        title: initialData.title || "",
        description: initialData.description || "",
        location: initialData.location || "",
        hostEmail: initialData.hostEmail || "",
        guestEmail: initialData.guestEmail || "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const [locationError, setLocationError] = useState(false);

    const handleLocationChange = (value) => {
        setFormData(prev => ({ ...prev, location: value }));
        if (value) setLocationError(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.location.trim()) {
            setLocationError(true);
            return;
        }
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <FormField id="hostEmail" Icon={Mail} label="Host Email" type="email" placeholder="parent@example.com" required value={formData.hostEmail} onChange={handleChange} />
            <FormField id="guestEmail" Icon={Mail} label="Guest Email" optional type="email" placeholder="friend@example.com" value={formData.guestEmail} onChange={handleChange} />
            <FormField id="title" Icon={Type} label="Event Title" placeholder="Bike date with Nile x Kai" required value={formData.title} onChange={handleChange} />

            <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" /> Location
                </Label>
                <LocationInput
                    id="location"
                    name="location"
                    placeholder="Nealon Park"
                    required
                    value={formData.location}
                    onChange={handleLocationChange}
                />
                {locationError && (
                    <p className="text-sm text-destructive">Please enter a location.</p>
                )}
            </div>

            <FormField id="description" Icon={AlignLeft} label="Description" optional placeholder="Let's ride bikes and explore the trails!" value={formData.description} onChange={handleChange} />

            <Button type="submit" className="w-full" size="lg">
                {isEditing ? "Save Changes" : "Next: Select Times"}
            </Button>
        </form>
    );
};
