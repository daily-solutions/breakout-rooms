/*
 * This is an example server-side function that provides the real-time presence
 * data of all the active rooms in the given domain.
 */
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'GET') {
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      },
    };

    const url: string = `${
      process.env.DAILY_API_URL || 'https://api.daily.co/v1'
    }/presence`;
    const dailyRes = await fetch(url, options);

    const response = await dailyRes.json();
    return res.status(200).json(response);
  }

  return res.status(500);
}
