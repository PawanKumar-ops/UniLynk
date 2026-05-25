import { connectDB } from "@/lib/mongodb";
import Form from "@/models/Form";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export async function POST(req) {
  try {
    await connectDB();
 const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }



    const data = await req.json();

     const normalizedEmail = session.user.email.toLowerCase();

    const parsedSeats =
      data?.seats === "" || data?.seats === null || data?.seats === undefined
        ? undefined
        : Number(data.seats);

    const payload = {
      ...data,
      ...(Number.isFinite(parsedSeats) ? { seats: parsedSeats } : { seats: undefined }),
      createdBy: normalizedEmail,
    };
    
     const form = await Form.create(payload);
    return Response.json(form);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
