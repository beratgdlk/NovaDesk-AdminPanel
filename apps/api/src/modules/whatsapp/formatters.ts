import type { Post } from '@onlyjs/db/client';


export abstract class PostFormatter {
  static response(data: Post & { author: { id: string; name: string } }) {

  }
}
