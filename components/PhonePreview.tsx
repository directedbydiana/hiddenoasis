import { ArrowLeft, Globe, Mail, MessageCircle, MoreVertical, Pencil, Phone, Star, Video } from "lucide-react";
import { ACCENTS, fullName, type PublicContact } from "@/lib/types";

// Approximations of how the downloaded vCard appears in the stock contacts
// apps, so card owners can see what each platform keeps or drops.

function Photo({ contact, size }: { contact: PublicContact; size: string }) {
  const initials = `${contact.firstName[0] ?? ""}${contact.lastName[0] ?? ""}`.toUpperCase();
  if (contact.photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={contact.photoUrl} alt="" className={`${size} rounded-full object-cover`} />;
  }
  return (
    <div className={`${size} rounded-full bg-slate-400 text-white flex items-center justify-center font-semibold`}>
      {initials || "?"}
    </div>
  );
}

function Frame({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div className="w-[17rem] mx-auto rounded-[2.2rem] border-[6px] border-black bg-black shadow-2xl overflow-hidden">
      <div className={`relative h-[34rem] overflow-y-auto text-[13px] leading-snug ${dark ? "bg-[#f2f2f7]" : "bg-white"}`}>
        {children}
      </div>
    </div>
  );
}

export function IosPreview({ contact }: { contact: PublicContact }) {
  const name = fullName(contact) || "No Name";
  const company = contact.orgs.join(", ");
  return (
    <Frame dark>
      <div className="h-6 bg-[#f2f2f7]" />
      <div className="flex items-center justify-between px-4 text-[#007aff]">
        <span>Cancel</span>
        <span className="text-black font-semibold">New Contact</span>
        <span className="font-semibold">Done</span>
      </div>
      <div className="flex flex-col items-center mt-3 px-4">
        <Photo contact={contact} size="w-20 h-20" />
        <div className="mt-2 text-[20px] font-semibold text-black text-center">{name}</div>
        {contact.title && <div className="text-[#6e6e73] text-center">{contact.title}</div>}
        {company && <div className="text-[#6e6e73] text-center">{company}</div>}
      </div>
      <div className="grid grid-cols-4 gap-2 px-4 mt-3">
        {[
          { Icon: MessageCircle, l: "message" },
          { Icon: Phone, l: "call" },
          { Icon: Video, l: "video" },
          { Icon: Mail, l: "mail" },
        ].map(({ Icon, l }) => (
          <div key={l} className="bg-white rounded-lg py-2 flex flex-col items-center text-[#007aff] text-[10px]">
            <Icon className="w-4 h-4 mb-1" />
            {l}
          </div>
        ))}
      </div>
      <div className="mt-3 mx-4 flex flex-col gap-2">
        {contact.phone && (
          <div className="bg-white rounded-lg px-3 py-2">
            <div className="text-[11px] text-black">mobile</div>
            <div className="text-[#007aff]">{contact.phone}</div>
          </div>
        )}
        {contact.email && (
          <div className="bg-white rounded-lg px-3 py-2">
            <div className="text-[11px] text-black">work</div>
            <div className="text-[#007aff] break-all">{contact.email}</div>
          </div>
        )}
        {contact.links.map((l) => (
          <div key={l.id} className="bg-white rounded-lg px-3 py-2">
            <div className="text-[11px] text-black">{l.label || l.kind}</div>
            <div className="text-[#007aff] break-all">{l.url.replace(/^https?:\/\//, "")}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 mx-4 mb-4 bg-white rounded-lg">
        <div className="px-3 py-2 text-[#007aff] border-b border-[#e5e5ea]">Create New Contact</div>
        <div className="px-3 py-2 text-[#007aff]">Add to Existing Contact</div>
      </div>
    </Frame>
  );
}

export function AndroidPreview({ contact }: { contact: PublicContact }) {
  const name = fullName(contact) || "(No name)";
  const subtitle = [contact.title, contact.orgs.join(", ")].filter(Boolean).join(" · ");
  const accent = ACCENTS[contact.design.accent].hex;
  return (
    <Frame>
      <div className="h-6 bg-white" />
      <div className="flex items-center justify-between px-3 text-[#444746]">
        <ArrowLeft className="w-4 h-4" />
        <div className="flex gap-3">
          <Pencil className="w-4 h-4" />
          <Star className="w-4 h-4" />
          <MoreVertical className="w-4 h-4" />
        </div>
      </div>
      <div className="flex flex-col items-center mt-3 px-4">
        <div className="rounded-full p-1" style={{ background: accent }}>
          <Photo contact={contact} size="w-20 h-20" />
        </div>
        <div className="mt-2 text-[20px] text-[#1f1f1f] text-center">{name}</div>
        {subtitle && <div className="text-[#444746] text-center text-[12px]">{subtitle}</div>}
      </div>
      <div className="grid grid-cols-4 gap-2 px-4 mt-3">
        {[
          { Icon: Phone, l: "Call" },
          { Icon: MessageCircle, l: "Text" },
          { Icon: Video, l: "Video" },
          { Icon: Mail, l: "Email" },
        ].map(({ Icon, l }) => (
          <div key={l} className="rounded-full bg-[#e8f0fe] py-1.5 flex flex-col items-center text-[#0b57d0] text-[10px]">
            <Icon className="w-4 h-4" />
            {l}
          </div>
        ))}
      </div>
      <div className="mt-4 mx-3 rounded-2xl bg-[#f0f4f9] px-3 py-2">
        <div className="text-[12px] font-medium text-[#1f1f1f] mb-1">Contact info</div>
        {contact.phone && (
          <div className="flex items-center gap-3 py-1.5">
            <Phone className="w-4 h-4 text-[#444746]" />
            <div>
              <div className="text-[#1f1f1f]">{contact.phone}</div>
              <div className="text-[11px] text-[#444746]">Mobile</div>
            </div>
          </div>
        )}
        {contact.email && (
          <div className="flex items-center gap-3 py-1.5">
            <Mail className="w-4 h-4 text-[#444746]" />
            <div className="min-w-0">
              <div className="text-[#1f1f1f] break-all">{contact.email}</div>
              <div className="text-[11px] text-[#444746]">Work</div>
            </div>
          </div>
        )}
        {contact.links.map((l) => (
          <div key={l.id} className="flex items-center gap-3 py-1.5">
            <Globe className="w-4 h-4 text-[#444746]" />
            <div className="min-w-0">
              <div className="text-[#1f1f1f] break-all">{l.url}</div>
              <div className="text-[11px] text-[#444746]">Website</div>
            </div>
          </div>
        ))}
        {!contact.phone && !contact.email && contact.links.length === 0 && (
          <div className="text-[#444746] py-1.5">No contact info</div>
        )}
      </div>
    </Frame>
  );
}
